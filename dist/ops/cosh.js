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
import { Cosh } from '../kernel_names';
import { convertToTensor } from '../tensor_util_env';
import { op } from './operation';
/**
 * Computes hyperbolic cos of the input `tf.Tensor` element-wise: `cosh(x)`
 *
 * ```js
 * const x = tf.tensor1d([0, 1, -1, .7]);
 *
 * x.cosh().print();  // or tf.cosh(x)
 * ```
 * @param x The input tensor.
 *
 * @doc {heading: 'Operations', subheading: 'Basic math'}
 */
function cosh_(x) {
    const $x = convertToTensor(x, 'x', 'cosh');
    const inputs = { x: $x };
    return ENGINE.runKernel(Cosh, inputs);
}
export const cosh = op({ cosh_ });
//# sourceMappingURL=cosh.js.map