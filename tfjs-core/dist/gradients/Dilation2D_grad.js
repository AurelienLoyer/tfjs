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
import { Dilation2D, Dilation2DBackpropFilter, Dilation2DBackpropInput } from '../kernel_names';
export const dilation2dGradConfig = {
    kernelName: Dilation2D,
    inputsToSave: ['x', 'filter'],
    gradFunc: (dy, saved, attrs) => {
        const [x, filter] = saved;
        const inputInputs = { x, filter, dy };
        const filterInputs = { x, filter, dy };
        return {
            x: () => ENGINE.runKernel(Dilation2DBackpropInput, inputInputs, attrs),
            filter: () => ENGINE.runKernel(Dilation2DBackpropFilter, filterInputs, attrs)
        };
    }
};
//# sourceMappingURL=Dilation2D_grad.js.map