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
import { FloorDiv } from '../kernel_names';
import { assertAndGetBroadcastShape, getReductionAxes } from '../ops/broadcast_util';
import { cast } from '../ops/cast';
import { div } from '../ops/div';
import { mul } from '../ops/mul';
import { neg } from '../ops/neg';
import { reshape } from '../ops/reshape';
import { square } from '../ops/square';
import { sum } from '../ops/sum';
export const floorDivGradConfig = {
    kernelName: FloorDiv,
    inputsToSave: ['a', 'b'],
    gradFunc: (dy, saved) => {
        const [a, b] = saved;
        const outShape = assertAndGetBroadcastShape(a.shape, b.shape);
        const derA = () => {
            const res = div(dy, cast(b, 'float32'));
            const reduceAxes = getReductionAxes(a.shape, outShape);
            if (reduceAxes.length > 0) {
                return reshape(sum(res, reduceAxes), a.shape);
            }
            return res;
        };
        const derB = () => {
            let res = mul(dy, cast(a, 'float32'));
            const reduceAxes = getReductionAxes(b.shape, outShape);
            if (reduceAxes.length > 0) {
                res = reshape(sum(res, reduceAxes), b.shape);
            }
            const tmp = square(b);
            return neg(div(res, cast(tmp, 'float32')));
        };
        return { a: derA, b: derB };
    }
};
//# sourceMappingURL=FloorDiv_grad.js.map