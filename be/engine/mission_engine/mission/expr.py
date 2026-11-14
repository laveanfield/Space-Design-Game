"""Bieu thuc tham chieu '@scenario.budget_musd * 0.8'. KHONG dung eval: duyet cay AST voi danh sach trang."""
import ast
import operator as op
from ..errors import PackInvalid

_BIN = {ast.Add: op.add, ast.Sub: op.sub, ast.Mult: op.mul, ast.Div: op.truediv, ast.Pow: op.pow}
_CMP = {ast.Lt: op.lt, ast.LtE: op.le, ast.Gt: op.gt, ast.GtE: op.ge, ast.Eq: op.eq, ast.NotEq: op.ne}
_FN = {"min": min, "max": max, "abs": abs, "len": len, "sum": sum}


def evaluate(expr, ctx):
    """Chuoi bat dau bang '@' la bieu thuc; gia tri khac tra ve nguyen."""
    if not (isinstance(expr, str) and expr.startswith("@")):
        return expr
    try:
        tree = ast.parse(expr[1:].strip(), mode="eval")
    except SyntaxError as e:
        raise PackInvalid(f"bieu thuc sai cu phap: {expr}", error=str(e))
    return _ev(tree.body, ctx, expr)


def _get(obj, name, expr):
    if isinstance(obj, dict) and name in obj:
        return obj[name]
    raise PackInvalid(f"khong tim thay '{name}' trong bieu thuc {expr}", name=name)


def _ev(n, ctx, expr):
    if isinstance(n, ast.Constant):
        return n.value
    if isinstance(n, ast.Name):
        return _get(ctx, n.id, expr)
    if isinstance(n, ast.Attribute):
        return _get(_ev(n.value, ctx, expr), n.attr, expr)
    if isinstance(n, ast.BinOp) and type(n.op) in _BIN:
        return _BIN[type(n.op)](_ev(n.left, ctx, expr), _ev(n.right, ctx, expr))
    if isinstance(n, ast.UnaryOp) and isinstance(n.op, (ast.USub, ast.Not)):
        v = _ev(n.operand, ctx, expr)
        return -v if isinstance(n.op, ast.USub) else (not v)
    if isinstance(n, ast.BoolOp):
        vals = [_ev(v, ctx, expr) for v in n.values]
        return all(vals) if isinstance(n.op, ast.And) else any(vals)
    if isinstance(n, ast.Compare):
        left = _ev(n.left, ctx, expr)
        for o, c in zip(n.ops, n.comparators):
            right = _ev(c, ctx, expr)
            if isinstance(o, ast.In):
                ok = left in right
            elif type(o) in _CMP:
                ok = _CMP[type(o)](left, right)
            else:
                raise PackInvalid(f"toan tu so sanh khong duoc phep: {expr}")
            if not ok:
                return False
            left = right
        return True
    if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in _FN and not n.keywords:
        return _FN[n.func.id](*[_ev(a, ctx, expr) for a in n.args])
    if isinstance(n, (ast.List, ast.Tuple)):
        return [_ev(e, ctx, expr) for e in n.elts]
    raise PackInvalid(f"thanh phan khong duoc phep trong bieu thuc: {expr}", node=type(n).__name__)
