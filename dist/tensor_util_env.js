/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { ENGINE } from './engine';
import { env } from './environment';
import { Tensor } from './tensor';
import { assert, flatten, inferDtype, isTypedArray, toTypedArray } from './util';
export function inferShape(val, dtype) {
    let firstElem = val;
    if (isTypedArray(val)) {
        return dtype === 'string' ? [] : [val.length];
    }
    if (!Array.isArray(val)) {
        return []; // Scalar.
    }
    const shape = [];
    while (Array.isArray(firstElem) ||
        isTypedArray(firstElem) && dtype !== 'string') {
        shape.push(firstElem.length);
        firstElem = firstElem[0];
    }
    if (Array.isArray(val) &&
        env().getBool('TENSORLIKE_CHECK_SHAPE_CONSISTENCY')) {
        deepAssertShapeConsistency(val, shape, []);
    }
    return shape;
}
function deepAssertShapeConsistency(val, shape, indices) {
    indices = indices || [];
    if (!(Array.isArray(val)) && !isTypedArray(val)) {
        assert(shape.length === 0, () => `Element arr[${indices.join('][')}] is a primitive, ` +
            `but should be an array/TypedArray of ${shape[0]} elements`);
        return;
    }
    assert(shape.length > 0, () => `Element arr[${indices.join('][')}] should be a primitive, ` +
        `but is an array of ${val.length} elements`);
    assert(val.length === shape[0], () => `Element arr[${indices.join('][')}] should have ${shape[0]} ` +
        `elements, but has ${val.length} elements`);
    const subShape = shape.slice(1);
    for (let i = 0; i < val.length; ++i) {
        deepAssertShapeConsistency(val[i], subShape, indices.concat(i));
    }
}
function assertDtype(expectedDtype, actualDType, argName, functionName) {
    if (expectedDtype === 'string_or_numeric') {
        return;
    }
    if (expectedDtype == null) {
        throw new Error(`Expected dtype cannot be null.`);
    }
    if (expectedDtype !== 'numeric' && expectedDtype !== actualDType ||
        expectedDtype === 'numeric' && actualDType === 'string') {
        throw new Error(`Argument '${argName}' passed to '${functionName}' must ` +
            `be ${expectedDtype} tensor, but got ${actualDType} tensor`);
    }
}
export function convertToTensor(x, argName, functionName, parseAsDtype = 'numeric') {
    if (x instanceof Tensor) {
        assertDtype(parseAsDtype, x.dtype, argName, functionName);
        return x;
    }
    let inferredDtype = inferDtype(x);
    // If the user expects a bool/int/float, use that info to update the
    // inferredDtype when it is not a string.
    if (inferredDtype !== 'string' &&
        ['bool', 'int32', 'float32'].indexOf(parseAsDtype) >= 0) {
        inferredDtype = parseAsDtype;
    }
    assertDtype(parseAsDtype, inferredDtype, argName, functionName);
    if ((x == null) ||
        (!isTypedArray(x) && !Array.isArray(x) && typeof x !== 'number' &&
            typeof x !== 'boolean' && typeof x !== 'string')) {
        const type = x == null ? 'null' : x.constructor.name;
        throw new Error(`Argument '${argName}' passed to '${functionName}' must be a ` +
            `Tensor or TensorLike, but got '${type}'`);
    }
    const inferredShape = inferShape(x, inferredDtype);
    if (!isTypedArray(x) && !Array.isArray(x)) {
        x = [x];
    }
    const skipTypedArray = true;
    const values = inferredDtype !== 'string' ?
        toTypedArray(x, inferredDtype) :
        flatten(x, [], skipTypedArray);
    return ENGINE.makeTensor(values, inferredShape, inferredDtype);
}
export function convertToTensorArray(arg, argName, functionName, parseAsDtype = 'numeric') {
    if (!Array.isArray(arg)) {
        throw new Error(`Argument ${argName} passed to ${functionName} must be a ` +
            '`Tensor[]` or `TensorLike[]`');
    }
    const tensors = arg;
    return tensors.map((t, i) => convertToTensor(t, `${argName}[${i}]`, functionName, parseAsDtype));
}
//# sourceMappingURL=tensor_util_env.js.map