/**
 * @license
 * Copyright 2017 Google LLC. All Rights Reserved.
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
import { getGlobal } from './global_util';
import { tensorToString } from './tensor_format';
import * as util from './util';
import { computeStrides, toNestedArray } from './util';
/**
 * A mutable object, similar to `tf.Tensor`, that allows users to set values
 * at locations before converting to an immutable `tf.Tensor`.
 *
 * See `tf.buffer` for creating a tensor buffer.
 *
 * @doc {heading: 'Tensors', subheading: 'Classes'}
 */
export class TensorBuffer {
    constructor(shape, dtype, values) {
        this.dtype = dtype;
        this.shape = shape.slice();
        this.size = util.sizeFromShape(shape);
        if (values != null) {
            const n = values.length;
            util.assert(n === this.size, () => `Length of values '${n}' does not match the size ` +
                `inferred by the shape '${this.size}'.`);
        }
        if (dtype === 'complex64') {
            throw new Error(`complex64 dtype TensorBuffers are not supported. Please create ` +
                `a TensorBuffer for the real and imaginary parts separately and ` +
                `call tf.complex(real, imag).`);
        }
        this.values = values || util.getArrayFromDType(dtype, this.size);
        this.strides = computeStrides(shape);
    }
    /**
     * Sets a value in the buffer at a given location.
     *
     * @param value The value to set.
     * @param locs  The location indices.
     *
     * @doc {heading: 'Tensors', subheading: 'Creation'}
     */
    set(value, ...locs) {
        if (locs.length === 0) {
            locs = [0];
        }
        util.assert(locs.length === this.rank, () => `The number of provided coordinates (${locs.length}) must ` +
            `match the rank (${this.rank})`);
        const index = this.locToIndex(locs);
        this.values[index] = value;
    }
    /**
     * Returns the value in the buffer at the provided location.
     *
     * @param locs The location indices.
     *
     * @doc {heading: 'Tensors', subheading: 'Creation'}
     */
    get(...locs) {
        if (locs.length === 0) {
            locs = [0];
        }
        let i = 0;
        for (const loc of locs) {
            if (loc < 0 || loc >= this.shape[i]) {
                const msg = `Requested out of range element at ${locs}. ` +
                    `  Buffer shape=${this.shape}`;
                throw new Error(msg);
            }
            i++;
        }
        let index = locs[locs.length - 1];
        for (let i = 0; i < locs.length - 1; ++i) {
            index += this.strides[i] * locs[i];
        }
        return this.values[index];
    }
    locToIndex(locs) {
        if (this.rank === 0) {
            return 0;
        }
        else if (this.rank === 1) {
            return locs[0];
        }
        let index = locs[locs.length - 1];
        for (let i = 0; i < locs.length - 1; ++i) {
            index += this.strides[i] * locs[i];
        }
        return index;
    }
    indexToLoc(index) {
        if (this.rank === 0) {
            return [];
        }
        else if (this.rank === 1) {
            return [index];
        }
        const locs = new Array(this.shape.length);
        for (let i = 0; i < locs.length - 1; ++i) {
            locs[i] = Math.floor(index / this.strides[i]);
            index -= locs[i] * this.strides[i];
        }
        locs[locs.length - 1] = index;
        return locs;
    }
    get rank() {
        return this.shape.length;
    }
    /**
     * Creates an immutable `tf.Tensor` object from the buffer.
     *
     * @doc {heading: 'Tensors', subheading: 'Creation'}
     */
    toTensor() {
        return trackerFn().makeTensor(this.values, this.shape, this.dtype);
    }
}
// For tracking tensor creation and disposal.
let trackerFn = null;
// Used by chaining methods to call into ops.
let opHandler = null;
// Used to warn about deprecated methods.
let deprecationWarningFn = null;
// This here so that we can use this method on dev branches and keep the
// functionality at master.
// tslint:disable-next-line:no-unused-expression
[deprecationWarningFn];
/**
 * An external consumer can register itself as the tensor tracker. This way
 * the Tensor class can notify the tracker for every tensor created and
 * disposed.
 */
export function setTensorTracker(fn) {
    trackerFn = fn;
}
/**
 * An external consumer can register itself as the op handler. This way the
 * Tensor class can have chaining methods that call into ops via the op
 * handler.
 */
export function setOpHandler(handler) {
    opHandler = handler;
}
/**
 * Sets the deprecation warning function to be used by this file. This way the
 * Tensor class can be a leaf but still use the environment.
 */
export function setDeprecationWarningFn(fn) {
    deprecationWarningFn = fn;
}
/**
 * A `tf.Tensor` object represents an immutable, multidimensional array of
 * numbers that has a shape and a data type.
 *
 * For performance reasons, functions that create tensors do not necessarily
 * perform a copy of the data passed to them (e.g. if the data is passed as a
 * `Float32Array`), and changes to the data will change the tensor. This is not
 * a feature and is not supported. To avoid this behavior, use the tensor before
 * changing the input data or create a copy with `copy = tf.add(yourTensor, 0)`.
 *
 * See `tf.tensor` for details on how to create a `tf.Tensor`.
 *
 * @doc {heading: 'Tensors', subheading: 'Classes'}
 */
export class Tensor {
    constructor(shape, dtype, dataId, id) {
        /** Whether this tensor has been globally kept. */
        this.kept = false;
        this.isDisposedInternal = false;
        this.shape = shape.slice();
        this.dtype = dtype || 'float32';
        this.size = util.sizeFromShape(shape);
        this.strides = computeStrides(shape);
        this.dataId = dataId;
        this.id = id;
        this.rankType = (this.rank < 5 ? this.rank.toString() : 'higher');
    }
    get rank() {
        return this.shape.length;
    }
    /**
     * Returns a promise of `tf.TensorBuffer` that holds the underlying data.
     *
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    async buffer() {
        const vals = await this.data();
        return opHandler.buffer(this.shape, this.dtype, vals);
    }
    /**
     * Returns a `tf.TensorBuffer` that holds the underlying data.
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    bufferSync() {
        return opHandler.buffer(this.shape, this.dtype, this.dataSync());
    }
    /**
     * Returns the tensor data as a nested array. The transfer of data is done
     * asynchronously.
     *
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    async array() {
        const vals = await this.data();
        return toNestedArray(this.shape, vals, this.dtype === 'complex64');
    }
    /**
     * Returns the tensor data as a nested array. The transfer of data is done
     * synchronously.
     *
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    arraySync() {
        return toNestedArray(this.shape, this.dataSync(), this.dtype === 'complex64');
    }
    /**
     * Asynchronously downloads the values from the `tf.Tensor`. Returns a
     * promise of `TypedArray` that resolves when the computation has finished.
     *
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    async data() {
        this.throwIfDisposed();
        const data = trackerFn().read(this.dataId);
        if (this.dtype === 'string') {
            const bytes = await data;
            try {
                return bytes.map(b => util.decodeString(b));
            }
            catch (_a) {
                throw new Error('Failed to decode the string bytes into utf-8. ' +
                    'To get the original bytes, call tensor.bytes().');
            }
        }
        return data;
    }
    /**
     * Synchronously downloads the values from the `tf.Tensor`. This blocks the
     * UI thread until the values are ready, which can cause performance issues.
     *
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    dataSync() {
        this.throwIfDisposed();
        const data = trackerFn().readSync(this.dataId);
        if (this.dtype === 'string') {
            try {
                return data.map(b => util.decodeString(b));
            }
            catch (_a) {
                throw new Error('Failed to decode the string bytes into utf-8. ' +
                    'To get the original bytes, call tensor.bytes().');
            }
        }
        return data;
    }
    /** Returns the underlying bytes of the tensor's data. */
    async bytes() {
        this.throwIfDisposed();
        const data = await trackerFn().read(this.dataId);
        if (this.dtype === 'string') {
            return data;
        }
        else {
            return new Uint8Array(data.buffer);
        }
    }
    /**
     * Disposes `tf.Tensor` from memory.
     *
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        trackerFn().disposeTensor(this);
        this.isDisposedInternal = true;
    }
    get isDisposed() {
        return this.isDisposedInternal;
    }
    throwIfDisposed() {
        if (this.isDisposed) {
            throw new Error(`Tensor is disposed.`);
        }
    }
    /**
     * Prints the `tf.Tensor`. See `tf.print` for details.
     *
     * @param verbose Whether to print verbose information about the tensor,
     *    including dtype and size.
     *
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    print(verbose = false) {
        return opHandler.print(this, verbose);
    }
    /**
     * Returns a copy of the tensor. See `tf.clone` for details.
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    clone() {
        this.throwIfDisposed();
        return opHandler.clone(this);
    }
    /**
     * Returns a human-readable description of the tensor. Useful for logging.
     *
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    toString(verbose = false) {
        const vals = this.dataSync();
        return tensorToString(vals, this.shape, this.dtype, verbose);
    }
    cast(dtype) {
        this.throwIfDisposed();
        return opHandler.cast(this, dtype);
    }
    variable(trainable = true, name, dtype) {
        this.throwIfDisposed();
        return trackerFn().makeVariable(this, trainable, name, dtype);
    }
}
Object.defineProperty(Tensor, Symbol.hasInstance, {
    value: (instance) => {
        // Implementation note: we should use properties of the object that will be
        // defined before the constructor body has finished executing (methods).
        // This is because when this code is transpiled by babel, babel will call
        // classCallCheck before the constructor body is run.
        // See https://github.com/tensorflow/tfjs/issues/3384 for backstory.
        return !!instance && instance.data != null && instance.dataSync != null &&
            instance.throwIfDisposed != null;
    }
});
export function getGlobalTensorClass() {
    // Use getGlobal so that we can augment the Tensor class across package
    // boundaries becase the node resolution alg may result in different modules
    // being returned for this file depending on the path they are loaded from.
    return getGlobal('Tensor', () => {
        return Tensor;
    });
}
// Global side effect. Cache global reference to Tensor class
getGlobalTensorClass();
/**
 * A mutable `tf.Tensor`, useful for persisting state, e.g. for training.
 *
 * @doc {heading: 'Tensors', subheading: 'Classes'}
 */
export class Variable extends Tensor {
    constructor(initialValue, trainable, name, tensorId) {
        super(initialValue.shape, initialValue.dtype, initialValue.dataId, tensorId);
        this.trainable = trainable;
        this.name = name;
    }
    /**
     * Assign a new `tf.Tensor` to this variable. The new `tf.Tensor` must have
     * the same shape and dtype as the old `tf.Tensor`.
     *
     * @param newValue New tensor to be assigned to this variable.
     *
     * @doc {heading: 'Tensors', subheading: 'Classes'}
     */
    assign(newValue) {
        if (newValue.dtype !== this.dtype) {
            throw new Error(`dtype of the new value (${newValue.dtype}) and ` +
                `previous value (${this.dtype}) must match`);
        }
        if (!util.arraysEqual(newValue.shape, this.shape)) {
            throw new Error(`shape of the new value (${newValue.shape}) and ` +
                `previous value (${this.shape}) must match`);
        }
        trackerFn().disposeTensor(this);
        this.dataId = newValue.dataId;
        trackerFn().incRef(this, null /* backend */);
    }
    dispose() {
        trackerFn().disposeVariable(this);
        this.isDisposedInternal = true;
    }
}
Object.defineProperty(Variable, Symbol.hasInstance, {
    value: (instance) => {
        return instance instanceof Tensor && instance.assign != null &&
            instance.assign instanceof Function;
    }
});
//# sourceMappingURL=tensor.js.map