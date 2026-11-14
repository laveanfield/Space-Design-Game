"""One UTF-8 JSON request per process; stdout always contains one JSON response."""
import json
import sys
from pathlib import Path
from .interface import InputError, load_request, run_request, error_response


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    code = 0
    try:
        if len(args)>1:
            raise InputError('INVALID_INPUT','Usage: cubesat-link [request.json|-]')
        text = (Path(args[0]).read_text(encoding='utf-8-sig') if args and args[0]!='-'
                else sys.stdin.read().lstrip('\ufeff'))
        response = run_request(load_request(text))
    except InputError as exc:
        response,code = error_response(exc),2
    except (OSError,UnicodeError) as exc:
        response,code = error_response(InputError('IO_ERROR',str(exc))),2
    except Exception:
        response,code = error_response(InputError('INTERNAL_ERROR','Unexpected solver failure')),3
    print(json.dumps(response,ensure_ascii=True,allow_nan=False,sort_keys=True))
    return code
