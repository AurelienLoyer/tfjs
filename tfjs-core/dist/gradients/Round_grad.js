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
import { Round } from '../kernel_names';
import { zerosLike } from '../ops/zeros_like';
export const roundGradConfig = {
    kernelName: Round,
    gradFunc: (dy) => {
        // TODO(nsthorat): Let gradients be null for cases where we want to stop
        // backpropgation.
        return { x: () => zerosLike(dy) };
    }
};
//# sourceMappingURL=Round_grad.js.map