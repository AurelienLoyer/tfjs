import * as tf from '../index';
import { ALL_ENVS, describeWithFlags } from '../jasmine_util';
import { expectArraysClose } from '../test_util';
describeWithFlags('logicalOr', ALL_ENVS, () => {
    it('Tensor1D.', async () => {
        let a = tf.tensor1d([1, 0, 0], 'bool');
        let b = tf.tensor1d([0, 1, 0], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 1, 0]);
        a = tf.tensor1d([0, 0, 0], 'bool');
        b = tf.tensor1d([0, 0, 0], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [0, 0, 0]);
        a = tf.tensor1d([1, 1], 'bool');
        b = tf.tensor1d([1, 1], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 1]);
    });
    it('mismatched Tensor1D shapes', () => {
        const a = tf.tensor1d([1, 0], 'bool');
        const b = tf.tensor1d([0, 1, 0], 'bool');
        const f = () => {
            tf.logicalOr(a, b);
        };
        expect(f).toThrowError();
    });
    it('Tensor2D', async () => {
        let a = tf.tensor2d([[1, 0, 1], [0, 0, 0]], [2, 3], 'bool');
        let b = tf.tensor2d([[0, 0, 0], [0, 1, 0]], [2, 3], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 0, 1, 0, 1, 0]);
        a = tf.tensor2d([[0, 0, 0], [1, 1, 1]], [2, 3], 'bool');
        b = tf.tensor2d([[0, 0, 0], [1, 1, 1]], [2, 3], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [0, 0, 0, 1, 1, 1]);
    });
    it('broadcasting Tensor2D shapes', async () => {
        const a = tf.tensor2d([[1], [0]], [2, 1], 'bool');
        const b = tf.tensor2d([[0, 0, 0], [0, 1, 0]], [2, 3], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 1, 1, 0, 1, 0]);
    });
    it('Tensor3D', async () => {
        let a = tf.tensor3d([[[1], [0], [1]], [[0], [0], [0]]], [2, 3, 1], 'bool');
        let b = tf.tensor3d([[[0], [0], [1]], [[1], [0], [0]]], [2, 3, 1], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 0, 1, 1, 0, 0]);
        a = tf.tensor3d([[[0], [0], [0]], [[1], [1], [1]]], [2, 3, 1], 'bool');
        b = tf.tensor3d([[[0], [0], [0]], [[1], [1], [1]]], [2, 3, 1], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [0, 0, 0, 1, 1, 1]);
    });
    it('broadcasting Tensor3D shapes', async () => {
        const a = tf.tensor3d([[[1, 0], [0, 0], [1, 1]], [[0, 0], [0, 1], [0, 0]]], [2, 3, 2], 'bool');
        const b = tf.tensor3d([[[0], [0], [1]], [[1], [0], [0]]], [2, 3, 1], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0]);
    });
    it('Tensor4D', async () => {
        let a = tf.tensor4d([1, 0, 1, 0], [2, 2, 1, 1], 'bool');
        let b = tf.tensor4d([0, 1, 0, 0], [2, 2, 1, 1], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 1, 1, 0]);
        a = tf.tensor4d([0, 0, 0, 0], [2, 2, 1, 1], 'bool');
        b = tf.tensor4d([0, 0, 0, 0], [2, 2, 1, 1], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [0, 0, 0, 0]);
        a = tf.tensor4d([1, 1, 1, 1], [2, 2, 1, 1], 'bool');
        b = tf.tensor4d([1, 1, 1, 1], [2, 2, 1, 1], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 1, 1, 1]);
    });
    it('broadcasting Tensor4D shapes', async () => {
        const a = tf.tensor4d([1, 0, 1, 0], [2, 2, 1, 1], 'bool');
        const b = tf.tensor4d([[[[1, 0]], [[0, 0]]], [[[0, 0]], [[1, 1]]]], [2, 2, 1, 2], 'bool');
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 1, 0, 0, 1, 1, 1, 1]);
    });
    it('TensorLike', async () => {
        const a = [true, false, false];
        const b = [false, true, false];
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 1, 0]);
    });
    it('TensorLike Chained', async () => {
        const a = tf.tensor1d([1, 0, 0], 'bool');
        const b = [false, true, false];
        expectArraysClose(await a.logicalOr(b).data(), [1, 1, 0]);
    });
    it('throws when passed a as a non-tensor', () => {
        expect(() => tf.logicalOr({}, tf.scalar(1, 'bool')))
            .toThrowError(/Argument 'a' passed to 'logicalOr' must be a Tensor/);
    });
    it('throws when passed b as a non-tensor', () => {
        expect(() => tf.logicalOr(tf.scalar(1, 'bool'), {}))
            .toThrowError(/Argument 'b' passed to 'logicalOr' must be a Tensor/);
    });
    it('accepts a tensor-like object', async () => {
        const a = [1, 0, 0, 1];
        const b = [0, 1, 0, 1];
        expectArraysClose(await tf.logicalOr(a, b).data(), [1, 1, 0, 1]);
    });
});
//# sourceMappingURL=logical_or_test.js.map