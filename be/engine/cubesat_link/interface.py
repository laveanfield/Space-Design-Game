"""Versioned JSON boundary, shared by the Python API and command line."""
from dataclasses import asdict
from datetime import datetime
from importlib.resources import files
import json
from math import isfinite

from . import __version__
from .api import evaluate_link
from .budget import Radio
from .geometry import contact_windows
from .ionosphere import ElectronPath, SlantTEC, Polarization
from .neutral import NeutralProfile
from .providers import (ProviderMetadata, NeutralTableProvider, P834ReferenceProvider,
                        BoundElectronProvider, PathBinding)
from .types import Earth, WGS84, GroundStation, SatelliteState, Effect


class InputError(ValueError):
    def __init__(self, code, message, path='$'):
        super().__init__(message)
        self.code, self.path = code, path


def load_request(text):
    def pairs(items):
        result = {}
        for key,value in items:
            if key in result:
                raise InputError('INVALID_JSON','Duplicate key: '+key)
            result[key] = value
        return result
    def invalid_constant(value):
        raise InputError('INVALID_JSON','Non-finite JSON constant: '+value)
    try:
        return json.loads(text,object_pairs_hook=pairs,parse_constant=invalid_constant)
    except json.JSONDecodeError as exc:
        raise InputError('INVALID_JSON',str(exc)) from exc


def schema_document(name='request'):
    if name not in ('request','response'):
        raise ValueError('Unknown schema name')
    return json.loads(files('cubesat_link').joinpath(name+'.schema.json').read_text(encoding='utf-8'))


def validate_document(value, schema, root=None, path='$'):
    """Validator for exactly the JSON Schema keywords shipped by this package.

    Not a general JSON Schema implementation. Portable schemas may also be used
    with an independent Draft 2020-12 validator by clients.
    """
    root = schema if root is None else root
    if '$ref' in schema:
        return validate_document(value,root['$defs'][schema['$ref'].split('/')[-1]],root,path)
    for keyword in ('oneOf','anyOf'):
        if keyword in schema:
            matches = 0
            for candidate in schema[keyword]:
                try:
                    validate_document(value,candidate,root,path)
                    matches += 1
                except InputError:
                    pass
            if matches == 0 or (keyword=='oneOf' and matches!=1):
                raise InputError('SCHEMA_ERROR','Value does not match '+keyword,path)
            return
    types = {'object':isinstance(value,dict),'array':isinstance(value,(list,tuple)),
             'string':isinstance(value,str),'boolean':type(value) is bool,
             'number':type(value) in (int,float) and isfinite(value),
             'integer':type(value) is int,'null':value is None}
    if 'type' in schema:
        allowed = schema['type'] if isinstance(schema['type'],list) else [schema['type']]
        if not any(types[t] for t in allowed):
            raise InputError('SCHEMA_ERROR','Expected '+str(schema['type']),path)
    if 'const' in schema and (value != schema['const'] or type(value)!=type(schema['const'])):
        raise InputError('SCHEMA_ERROR','Unexpected constant',path)
    if 'enum' in schema and value not in schema['enum']:
        raise InputError('SCHEMA_ERROR','Value outside enum',path)
    if isinstance(value,dict):
        properties = schema.get('properties',{})
        for key in schema.get('required',[]):
            if key not in value:
                raise InputError('SCHEMA_ERROR','Missing required field',path+'.'+key)
        if len(value)<schema.get('minProperties',0):
            raise InputError('SCHEMA_ERROR','Too few properties',path)
        for key,item in value.items():
            if key in properties:
                validate_document(item,properties[key],root,path+'.'+key)
            elif schema.get('additionalProperties') is False:
                raise InputError('SCHEMA_ERROR','Unknown field',path+'.'+key)
            elif isinstance(schema.get('additionalProperties'),dict):
                validate_document(item,schema['additionalProperties'],root,path+'.'+key)
    if isinstance(value,(list,tuple)):
        if not schema.get('minItems',0)<=len(value)<=schema.get('maxItems',float('inf')):
            raise InputError('SCHEMA_ERROR','Invalid array length',path)
        for i,item in enumerate(value):
            validate_document(item,schema.get('items',{}),root,f'{path}[{i}]')
    if isinstance(value,str) and len(value)<schema.get('minLength',0):
        raise InputError('SCHEMA_ERROR','String too short',path)
    if type(value) in (int,float):
        if not isfinite(value):
            raise InputError('SCHEMA_ERROR','Non-finite number',path)
        if value<schema.get('minimum',-float('inf')) or value>schema.get('maximum',float('inf')):
            raise InputError('SCHEMA_ERROR','Number outside range',path)
        if 'exclusiveMinimum' in schema and value<=schema['exclusiveMinimum']:
            raise InputError('SCHEMA_ERROR','Number must exceed minimum',path)


def _epoch(value):
    return datetime.fromisoformat(value.replace('Z','+00:00'))


def _earth(data):
    return WGS84 if data['model']=='WGS84' else Earth(data['radius_m'],0)


def _state(data):
    return SatelliteState(tuple(data['position_m']),data['frame'],_epoch(data['epoch_utc']))


def _metadata(data):
    return ProviderMetadata(**dict(data,epoch_utc=_epoch(data['epoch_utc'])))


def _binding(data):
    return PathBinding(GroundStation(**data['station']),_state(data['state']),
                       _earth(data['earth']),data['path_kind'],data['path_length_m'])


def run_request(request):
    """Validate a JSON-compatible request and return a versioned response.

    Raises InputError for invalid requests; unavailable physics remains a success
    response containing explicit not_computable effects.
    """
    if isinstance(request,dict) and request.get('schema_version','1.0')!='1.0':
        raise InputError('UNSUPPORTED_SCHEMA','Only schema_version 1.0 is supported')
    validate_document(request,schema_document())
    try:
        station = GroundStation(**request['station'])
        earth = _earth(request['earth'])
        operation = request['operation']
        if operation == 'contact_windows':
            windows = contact_windows(station,[_state(s) for s in request['states']],earth,
                                      max_gap_s=request.get('max_gap_s',60),mode=request.get('mode','geometric'))
            result = {'windows':[dict(asdict(w),start_utc=w.start_utc.isoformat().replace('+00:00','Z'),
                                       end_utc=w.end_utc.isoformat().replace('+00:00','Z')) for w in windows],
                      'mode':'geometric','earth':request['earth']}
        else:
            options = {'earth':earth,'vacuum':request.get('vacuum',False)}
            if 'radio' in request:
                options['radio'] = Radio(**request['radio'])
            if 'polarization' in request:
                options['polarization'] = Polarization(**request['polarization'])
            if 'neutral' in request:
                n = request['neutral']
                options['neutral_provider'] = (P834ReferenceProvider() if n['kind']=='p834_reference' else
                    NeutralTableProvider(NeutralProfile(**n['profile']),_metadata(n['metadata'])))
            if 'electrons' in request:
                e = request['electrons']
                data = ElectronPath(**e['data']) if e['kind']=='path' else SlantTEC(**e['data'])
                options['electron_provider'] = BoundElectronProvider(data,_metadata(e['metadata']),_binding(e['binding']))
            if 'supplied_losses' in request:
                options['supplied_losses'] = {k:Effect(**v) for k,v in request['supplied_losses'].items()}
            result = evaluate_link(station,_state(request['state']),request['frequency_hz'],**options).to_dict()
        return {'schema_version':'1.0','release':__version__,'ok':True,'operation':operation,'result':result}
    except (ValueError,TypeError,OverflowError) as exc:
        raise InputError('INVALID_INPUT',str(exc)) from exc


def error_response(error):
    return {'schema_version':'1.0','release':__version__,'ok':False,
            'error':{'code':error.code,'message':str(error),'path':error.path}}
