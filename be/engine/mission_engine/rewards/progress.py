"""Tien trinh nguoi choi: XP -> level -> mo khoa (tier thiet bi basic/advanced co san trong library)."""


def level_for(xp, levels):
    return max((i for i, lo in enumerate(levels) if xp >= lo), default=0)


def unlocks_for(level, table):
    """Hop cac unlock tu level 0 den `level` (khoa sau de len khoa truoc)."""
    out = {}
    for lv in sorted(table):
        if int(lv) <= level:
            out.update(table[lv])
    return out
