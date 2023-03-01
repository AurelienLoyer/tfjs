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
import { ENGINE } from '../engine';
import { MaxPool3DGrad } from '../kernel_names';
import { convertToTensor } from '../tensor_util_env';
import * as util from '../util';
import { op } from './operation';
import { reshape } from './reshape';
/**
 * Computes the backprop of a 3d max pool.
 *
 * @param dy The dy error, of rank 5 of shape
 *     [batchSize, depth, height, width, channels].
 * assumed.
 * @param input The original input image, of rank 5 or rank 4 of shape
 *     [batchSize, depth, height, width, channels].
 * @param output The original output image, of rank 5 of shape
 *     [batchSize, outDepth, outHeight, outWidth, channels].
 * @param filterSize The filter size:
 *     `[filterDepth, filterHeight, filterWidth]`.
 *     `filterSize` is a single number,
 *     then `filterDepth == filterHeight == filterWidth`.
 * @param strides The strides of the pooling:
 *     `[strideDepth, strideHeight, strideWidth]`. If
 *     `strides` is a single number, then `strideHeight == strideWidth`.
 * @param pad A string from: 'same', 'valid'. The type of padding algorithm
 *     used in the forward prop of the op.
 * @param dimRoundingMode A string from: 'ceil', 'round', 'floor'. If none is
 *     provided, it will default to truncate.
 */
function maxPool3dGrad_(dy, input, output, filterSize, strides, pad, dimRoundingMode) {
    const $dy = convertToTensor(dy, 'dy', 'maxPool3dGrad');
    const $input = convertToTensor(input, 'input', 'maxPool3dGrad');
    const $output = convertToTensor(output, 'output', 'maxPool3dGrad');
    let dy5D = $dy;
    let input5D = $input;
    let output5D = $output;
    let reshapedTo5D = false;
    if ($input.rank === 4) {
        reshapedTo5D = true;
        dy5D = reshape($dy, [1, $dy.shape[0], $dy.shape[1], $dy.shape[2], $dy.shape[3]]);
        input5D = reshape($input, [
            1, $input.shape[0], $input.shape[1], $input.shape[2], $input.shape[3]
        ]);
        output5D = reshape($output, [
            1, $output.shape[0], $output.shape[1], $output.shape[2], $output.shape[3]
        ]);
    }
    util.assert(dy5D.rank === 5, () => `Error in maxPool3dGrad: dy must be rank 5 but got rank ` +
        `${dy5D.rank}.`);
    util.assert(input5D.rank === 5, () => `Error in maxPool3dGrad: input must be rank 5 but got rank ` +
        `${input5D.rank}.`);
    util.assert(output5D.rank === 5, () => `Error in maxPool3dGrad: output must be rank 5 but got rank ` +
        `${output5D.rank}.`);
    if (dimRoundingMode != null) {
        util.assert(util.isInt(pad), () => `Error in maxPool3dGrad: pad must be an integer when ` +
            `using, dimRoundingMode ${dimRoundingMode} but got pad ${pad}.`);
    }
    const inputs = { dy: dy5D, input: input5D, output: output5D };
    const attrs = { filterSize, strides, pad, dimRoundingMode };
    // tslint:disable-next-line: no-unnecessary-type-assertion
    const res = ENGINE.runKernel(MaxPool3DGrad, inputs, attrs);
    if (reshapedTo5D) {
        return reshape(res, [res.shape[1], res.shape[2], res.shape[3], res.shape[4]]);
    }
    return res;
}
export const maxPool3dGrad = op({ maxPool3dGrad_ });
//# sourceMappingURL=max_pool_3d_grad.js.map