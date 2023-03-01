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
import { stack } from '../../ops/stack';
import { getGlobalTensorClass, Tensor } from '../../tensor';
getGlobalTensorClass().prototype.stack = function (x, axis) {
    this.throwIfDisposed();
    const tensorsToBeStacked = x instanceof Tensor ? [this, x] : [this, ...x];
    return stack(tensorsToBeStacked, axis);
};
//# sourceMappingURL=stack.js.map