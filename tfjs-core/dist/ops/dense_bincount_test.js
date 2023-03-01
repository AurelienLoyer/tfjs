/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
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
import * as tf from '../index';
import { ALL_ENVS, describeWithFlags } from '../jasmine_util';
import { expectArraysClose } from '../test_util';
describeWithFlags('denseBincount', ALL_ENVS, () => {
    it('with 0-length weights.', async () => {
        const x = tf.tensor1d([1, 1, 1, 2], 'int32');
        const weights = tf.tensor1d([]);
        const size = 3;
        const result = tf.denseBincount(x, weights, size);
        expect(result.shape).toEqual([3]);
        expectArraysClose(await result.data(), [0, 3, 1]);
    });
    it('with number out of range.', async () => {
        const x = tf.tensor1d([1, 1, 1, 2], 'int32');
        const weights = tf.tensor1d([]);
        const size = 2;
        const result = tf.denseBincount(x, weights, size);
        expect(result.shape).toEqual([2]);
        expectArraysClose(await result.data(), [0, 3]);
    });
    it('with 1d float weights.', async () => {
        const x = tf.tensor1d([1, 1, 1, 2], 'int32');
        const weights = tf.tensor1d([0.5, 0.3, 0.3, 0.1]);
        const size = 3;
        const result = tf.denseBincount(x, weights, size);
        expect(result.shape).toEqual([3]);
        expectArraysClose(await result.data(), [0, 1.1, 0.1]);
    });
    it('with 1d float weights and number out of range.', async () => {
        const x = tf.tensor1d([1, 1, 1, 2], 'int32');
        const weights = tf.tensor1d([0.5, 0.3, 0.3, 0.1]);
        const size = 2;
        const result = tf.denseBincount(x, weights, size);
        expect(result.shape).toEqual([2]);
        expectArraysClose(await result.data(), [0, 1.1]);
    });
    it('with 2d inputs and 0-length weights.', async () => {
        const x = tf.tensor2d([[1, 1], [1, 2]], [2, 2], 'int32');
        const weights = tf.tensor2d([], [0, 0]);
        const size = 3;
        const result = tf.denseBincount(x, weights, size);
        expect(result.shape).toEqual([2, 3]);
        expectArraysClose(await result.data(), [0, 2, 0, 0, 1, 1]);
    });
    it('with 2d inputs and 0-length weights and number out of range.', async () => {
        const x = tf.tensor2d([[1, 1], [1, 2]], [2, 2], 'int32');
        const weights = tf.tensor2d([], [0, 0]);
        const size = 2;
        const result = tf.denseBincount(x, weights, size);
        expect(result.shape).toEqual([2, 2]);
        expectArraysClose(await result.data(), [0, 2, 0, 1]);
    });
    it('with 2d inputs and 2d weights.', async () => {
        const x = tf.tensor2d([[1, 1], [1, 2]], [2, 2], 'int32');
        const weights = tf.tensor2d([[0.5, 0.3], [0.3, 0.1]]);
        const size = 3;
        const result = tf.denseBincount(x, weights, size);
        expect(result.shape).toEqual([2, 3]);
        expectArraysClose(await result.data(), [0, 0.8, 0, 0, 0.3, 0.1]);
    });
    it('throws error for non int x tensor.', async () => {
        const x = tf.tensor1d([1, 1, 1, 2], 'float32');
        const weights = tf.tensor1d([]);
        const size = 3;
        expect(() => tf.denseBincount(x, weights, size)).toThrowError();
    });
    it('throws error if size is negative.', async () => {
        const x = tf.tensor1d([1, 1, 1, 2], 'int32');
        const weights = tf.tensor1d([]);
        const size = -1;
        expect(() => tf.denseBincount(x, weights, size)).toThrowError();
    });
    it('throws error when shape is different for 1d.', async () => {
        const x = tf.tensor1d([1, 1, 1, 2], 'int32');
        const weights = tf.tensor1d([0.5, 0.3]);
        const size = 2;
        expect(() => tf.denseBincount(x, weights, size)).toThrowError();
    });
    it('throws error when shape is different for 2d.', async () => {
        const x = tf.tensor2d([[1, 1], [1, 2]], [2, 2], 'int32');
        const weights = tf.tensor2d([[0.5], [0.3]]);
        const size = 3;
        expect(() => tf.denseBincount(x, weights, size)).toThrowError();
    });
    it('handle output from other ops.', async () => {
        const x = tf.tensor1d([1, 1, 1, 2], 'int32');
        const weights = tf.tensor1d([]);
        const size = 4;
        const result = tf.denseBincount(tf.add(x, tf.scalar(1, 'int32')), weights, size);
        expect(result.shape).toEqual([4]);
        expectArraysClose(await result.data(), [0, 0, 3, 1]);
    });
});
//# sourceMappingURL=dense_bincount_test.js.map