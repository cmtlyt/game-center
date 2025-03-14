import type { TObject } from '@cmtlyt/base';
import { isNull } from '@cmtlyt/base';
import { apply, curry, deepExecWith_, map, pick, pipe, reduce, rename, zip } from '@cmtlyt/base/fp/utils';

function arrayToRenameObj(obj: string[]) {
  return reduce((pre, cur: string) => {
    const [on, nn = on] = cur.split(':');
    pre[on] = nn;
    return pre;
  }, {} as TObject<any>)(obj);
}

const getOriName = map((item: string) => item.split(':')[0]);

const pickFormRenameArray = pipe(getOriName, pick);

const mergeRenameObj = pipe(arrayToRenameObj, zip);

export const pickRename = curry((arr: string[], obj: TObject<any>): TObject<any> => {
  return pipe(pickFormRenameArray(arr), mergeRenameObj(arr), apply(rename))(obj);
});

const propsTransform = curry((keys, transform, obj) =>
  deepExecWith_(transform, (v, k) => keys.includes(k) && !isNull(v), obj),
);

const pickRenameTransform = curry((arr, keys, transform, obj) => pipe(pickRename(arr), propsTransform(keys, transform))(obj));

export const pickRenameTransformNumber = curry((arr, keys, obj) => pickRenameTransform(arr, keys, Number, obj));
