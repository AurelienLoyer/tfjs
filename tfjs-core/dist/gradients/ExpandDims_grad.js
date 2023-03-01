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
import { ExpandDims } from '../kernel_names';
import { reshape } from '../ops/reshape';
export const expandDimsGradConfig = {
    kernelName: ExpandDims,
    inputsToSave: ['input'],
    gradFunc: (dy, saved) => {
        const [input] = saved;
        return { input: () => reshape(dy, input.shape) };
    }
};
//# sourceMappingURL=ExpandDims_grad.js.map