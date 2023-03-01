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
import { ENGINE } from '../engine';
import { ZerosLike } from '../kernel_names';
import { convertToTensor } from '../tensor_util_env';
import { op } from './operation';
/**
 * Creates a `tf.Tensor` with all elements set to 0 with the same shape as the
 * given tensor.
 *
 * ```js
 * const x = tf.tensor([1, 2]);
 * tf.zerosLike(x).print();
 * ```
 *
 * @param x The tensor of required shape.
 *
 * @doc {heading: 'Tensors', subheading: 'Creation'}
 */
function zerosLike_(x) {
    const $x = convertToTensor(x, 'x', 'zerosLike');
    const inputs = { x: $x };
    return ENGINE.runKernel(ZerosLike, inputs);
}
export const zerosLike = op({ zerosLike_ });
//# sourceMappingURL=zeros_like.js.map