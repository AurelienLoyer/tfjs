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
import { Relu6 } from '../kernel_names';
import { cast } from '../ops/cast';
import { lessEqual } from '../ops/less_equal';
import { mul } from '../ops/mul';
import { step } from '../ops/step';
export const relu6GradConfig = {
    kernelName: Relu6,
    inputsToSave: ['x'],
    gradFunc: (dy, saved) => {
        const [x] = saved;
        const mask = mul(lessEqual(x, 6), step(x));
        return { x: () => mul(dy, cast(mask, 'float32')) };
    }
};
//# sourceMappingURL=Relu6_grad.js.map