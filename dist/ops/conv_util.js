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
/**
 *
 * @param inputShape Input tensor shape is of the following dimensions:
 *     `[batch, height, width, inChannels]`.
 * @param filterShape The filter shape is of the following dimensions:
 *     `[filterHeight, filterWidth, depth]`.
 * @param strides The strides of the sliding window for each dimension of the
 *     input tensor: `[strideHeight, strideWidth]`.
 *     If `strides` is a single number,
 *     then `strideHeight == strideWidth`.
 * @param pad The type of padding algorithm.
 *    - `same` and stride 1: output will be of same size as input,
 *       regardless of filter size.
 *    - `valid`: output will be smaller than input if filter is larger
 *       than 1*1x1.
 *    - For more info, see this guide:
 *     [https://www.tensorflow.org/api_guides/python/nn#Convolution](
 *          https://www.tensorflow.org/api_guides/python/nn#Convolution)
 * @param dataFormat The data format of the input and output data.
 *     Defaults to 'NHWC'.
 * @param dilations The dilation rates: `[dilationHeight, dilationWidth]`.
 *     Defaults to `[1, 1]`. If `dilations` is a single number, then
 *     `dilationHeight == dilationWidth`.
 */
export function computeDilation2DInfo(inputShape, filterShape, strides, pad, dataFormat = 'NHWC', dilations) {
    // `computerConv2DInfo` require filterShape to be in the dimension of:
    // `[filterHeight, filterWidth, depth, outDepth]`, dilation2d doesn't have
    // outDepth, it should have the same depth as the input.
    // Input shape: [batch, height, width, inChannels]
    const inputChannels = inputShape[3];
    const $filterShape = [...filterShape, inputChannels];
    const $dataFormat = convertConv2DDataFormat(dataFormat);
    return computeConv2DInfo(inputShape, $filterShape, strides, dilations, pad, null /* roundingMode */, null /* depthWise */, $dataFormat);
}
export function computePool2DInfo(inShape, filterSize, strides, dilations, pad, roundingMode, dataFormat = 'channelsLast') {
    const [filterHeight, filterWidth] = parseTupleParam(filterSize);
    let filterShape;
    if (dataFormat === 'channelsLast') {
        filterShape = [filterHeight, filterWidth, inShape[3], inShape[3]];
    }
    else if (dataFormat === 'channelsFirst') {
        filterShape = [filterHeight, filterWidth, inShape[1], inShape[1]];
    }
    else {
        throw new Error(`Unknown dataFormat ${dataFormat}`);
    }
    return computeConv2DInfo(inShape, filterShape, strides, dilations, pad, roundingMode, false, dataFormat);
}
/**
 * Computes the information for a forward pass of a pooling3D operation.
 */
export function computePool3DInfo(inShape, filterSize, strides, dilations, pad, roundingMode, dataFormat = 'NDHWC') {
    const [filterDepth, filterHeight, filterWidth] = parse3TupleParam(filterSize);
    let filterShape;
    let $dataFormat;
    if (dataFormat === 'NDHWC') {
        $dataFormat = 'channelsLast';
        filterShape =
            [filterDepth, filterHeight, filterWidth, inShape[4], inShape[4]];
    }
    else if (dataFormat === 'NCDHW') {
        $dataFormat = 'channelsFirst';
        filterShape =
            [filterDepth, filterHeight, filterWidth, inShape[1], inShape[1]];
    }
    else {
        throw new Error(`Unknown dataFormat ${dataFormat}`);
    }
    return computeConv3DInfo(inShape, filterShape, strides, dilations, pad, false, $dataFormat, roundingMode);
}
/**
 * Computes the information for a forward pass of a convolution/pooling
 * operation.
 */
export function computeConv2DInfo(inShape, filterShape, strides, dilations, pad, roundingMode, depthwise = false, dataFormat = 'channelsLast') {
    let [batchSize, inHeight, inWidth, inChannels] = [-1, -1, -1, -1];
    if (dataFormat === 'channelsLast') {
        [batchSize, inHeight, inWidth, inChannels] = inShape;
    }
    else if (dataFormat === 'channelsFirst') {
        [batchSize, inChannels, inHeight, inWidth] = inShape;
    }
    else {
        throw new Error(`Unknown dataFormat ${dataFormat}`);
    }
    const [filterHeight, filterWidth, , filterChannels] = filterShape;
    const [strideHeight, strideWidth] = parseTupleParam(strides);
    const [dilationHeight, dilationWidth] = parseTupleParam(dilations);
    const effectiveFilterHeight = getEffectiveFilterSize(filterHeight, dilationHeight);
    const effectiveFilterWidth = getEffectiveFilterSize(filterWidth, dilationWidth);
    const { padInfo, outHeight, outWidth } = getPadAndOutInfo(pad, inHeight, inWidth, strideHeight, strideWidth, effectiveFilterHeight, effectiveFilterWidth, roundingMode, dataFormat);
    const outChannels = depthwise ? filterChannels * inChannels : filterChannels;
    let outShape;
    if (dataFormat === 'channelsFirst') {
        outShape = [batchSize, outChannels, outHeight, outWidth];
    }
    else if (dataFormat === 'channelsLast') {
        outShape = [batchSize, outHeight, outWidth, outChannels];
    }
    return {
        batchSize,
        dataFormat,
        inHeight,
        inWidth,
        inChannels,
        outHeight,
        outWidth,
        outChannels,
        padInfo,
        strideHeight,
        strideWidth,
        filterHeight,
        filterWidth,
        effectiveFilterHeight,
        effectiveFilterWidth,
        dilationHeight,
        dilationWidth,
        inShape,
        outShape,
        filterShape
    };
}
/**
 * Computes the information for a forward pass of a 3D convolution/pooling
 * operation.
 */
export function computeConv3DInfo(inShape, filterShape, strides, dilations, pad, depthwise = false, dataFormat = 'channelsLast', roundingMode) {
    let [batchSize, inDepth, inHeight, inWidth, inChannels] = [-1, -1, -1, -1, -1];
    if (dataFormat === 'channelsLast') {
        [batchSize, inDepth, inHeight, inWidth, inChannels] = inShape;
    }
    else if (dataFormat === 'channelsFirst') {
        [batchSize, inChannels, inDepth, inHeight, inWidth] = inShape;
    }
    else {
        throw new Error(`Unknown dataFormat ${dataFormat}`);
    }
    const [filterDepth, filterHeight, filterWidth, , filterChannels] = filterShape;
    const [strideDepth, strideHeight, strideWidth] = parse3TupleParam(strides);
    const [dilationDepth, dilationHeight, dilationWidth] = parse3TupleParam(dilations);
    const effectiveFilterDepth = getEffectiveFilterSize(filterDepth, dilationDepth);
    const effectiveFilterHeight = getEffectiveFilterSize(filterHeight, dilationHeight);
    const effectiveFilterWidth = getEffectiveFilterSize(filterWidth, dilationWidth);
    const { padInfo, outDepth, outHeight, outWidth } = get3DPadAndOutInfo(pad, inDepth, inHeight, inWidth, strideDepth, strideHeight, strideWidth, effectiveFilterDepth, effectiveFilterHeight, effectiveFilterWidth, roundingMode);
    const outChannels = depthwise ? filterChannels * inChannels : filterChannels;
    let outShape;
    if (dataFormat === 'channelsFirst') {
        outShape = [batchSize, outChannels, outDepth, outHeight, outWidth];
    }
    else if (dataFormat === 'channelsLast') {
        outShape = [batchSize, outDepth, outHeight, outWidth, outChannels];
    }
    return {
        batchSize,
        dataFormat,
        inDepth,
        inHeight,
        inWidth,
        inChannels,
        outDepth,
        outHeight,
        outWidth,
        outChannels,
        padInfo,
        strideDepth,
        strideHeight,
        strideWidth,
        filterDepth,
        filterHeight,
        filterWidth,
        effectiveFilterDepth,
        effectiveFilterHeight,
        effectiveFilterWidth,
        dilationDepth,
        dilationHeight,
        dilationWidth,
        inShape,
        outShape,
        filterShape
    };
}
function computeOutputShape2D(inShape, fieldSize, stride, zeroPad, roundingMode) {
    if (zeroPad == null) {
        zeroPad = computeDefaultPad(inShape, fieldSize, stride);
    }
    const inputRows = inShape[0];
    const inputCols = inShape[1];
    const outputRows = round((inputRows - fieldSize + 2 * zeroPad) / stride + 1, roundingMode);
    const outputCols = round((inputCols - fieldSize + 2 * zeroPad) / stride + 1, roundingMode);
    return [outputRows, outputCols];
}
function computeOutputShape4D(inShape, fieldSize, outChannels, stride, zeroPad, roundingMode) {
    if (zeroPad == null) {
        zeroPad = computeDefaultPad(inShape, fieldSize, stride);
    }
    const inputDepth = inShape[0];
    const inputRows = inShape[1];
    const inputCols = inShape[2];
    const outputDepths = round((inputDepth - fieldSize + 2 * zeroPad) / stride + 1, roundingMode);
    const outputRows = round((inputRows - fieldSize + 2 * zeroPad) / stride + 1, roundingMode);
    const outputCols = round((inputCols - fieldSize + 2 * zeroPad) / stride + 1, roundingMode);
    return [outputDepths, outputRows, outputCols, outChannels];
}
export function computeDefaultPad(inputShape, fieldSize, stride, dilation = 1) {
    const effectiveFieldSize = getEffectiveFilterSize(fieldSize, dilation);
    return Math.floor((inputShape[0] * (stride - 1) - stride + effectiveFieldSize) / 2);
}
function parseTupleParam(param) {
    if (typeof param === 'number') {
        return [param, param, param];
    }
    if (param.length === 2) {
        return [param[0], param[1], 1];
    }
    return param;
}
function parse3TupleParam(param) {
    return typeof param === 'number' ? [param, param, param] : param;
}
/* See https://www.tensorflow.org/api_docs/python/tf/nn/atrous_conv2d
 * Atrous convolution is equivalent to standard convolution with upsampled
 * filters with effective_filter_height =
 * filter_height + (filter_height - 1) * (dilation - 1)
 * and effective_filter_width =
 * filter_width + (filter_width - 1) * (dilation - 1),
 * produced by inserting dilation - 1 zeros along consecutive elements across
 * the filters' spatial dimensions.
 * When there is a dilation, this converts a filter dimension to the
 * effective filter dimension, so it can be used in a standard convolution.
 */
function getEffectiveFilterSize(filterSize, dilation) {
    if (dilation <= 1) {
        return filterSize;
    }
    return filterSize + (filterSize - 1) * (dilation - 1);
}
function getPadAndOutInfo(pad, inHeight, inWidth, strideHeight, strideWidth, filterHeight, filterWidth, roundingMode, dataFormat) {
    let padInfo;
    let outHeight;
    let outWidth;
    if (typeof pad === 'number') {
        const padType = (pad === 0) ? 'VALID' : 'NUMBER';
        padInfo = { top: pad, bottom: pad, left: pad, right: pad, type: padType };
        const outShape = computeOutputShape2D([inHeight, inWidth], filterHeight, strideHeight, pad, roundingMode);
        outHeight = outShape[0];
        outWidth = outShape[1];
    }
    else if (pad === 'same') {
        outHeight = Math.ceil(inHeight / strideHeight);
        outWidth = Math.ceil(inWidth / strideWidth);
        const padAlongHeight = Math.max(0, (outHeight - 1) * strideHeight + filterHeight - inHeight);
        const padAlongWidth = Math.max(0, (outWidth - 1) * strideWidth + filterWidth - inWidth);
        const top = Math.floor(padAlongHeight / 2);
        const bottom = padAlongHeight - top;
        const left = Math.floor(padAlongWidth / 2);
        const right = padAlongWidth - left;
        padInfo = { top, bottom, left, right, type: 'SAME' };
    }
    else if (pad === 'valid') {
        padInfo = { top: 0, bottom: 0, left: 0, right: 0, type: 'VALID' };
        outHeight = Math.ceil((inHeight - filterHeight + 1) / strideHeight);
        outWidth = Math.ceil((inWidth - filterWidth + 1) / strideWidth);
    }
    else if (typeof pad === 'object') {
        const top = dataFormat === 'channelsLast' ? pad[1][0] : pad[2][0];
        const bottom = dataFormat === 'channelsLast' ? pad[1][1] : pad[2][1];
        const left = dataFormat === 'channelsLast' ? pad[2][0] : pad[3][0];
        const right = dataFormat === 'channelsLast' ? pad[2][1] : pad[3][1];
        const padType = (top === 0 && bottom === 0 && left === 0 && right === 0) ?
            'VALID' :
            'EXPLICIT';
        padInfo = { top, bottom, left, right, type: padType };
        outHeight = round((inHeight - filterHeight + top + bottom) / strideHeight + 1, roundingMode);
        outWidth = round((inWidth - filterWidth + left + right) / strideWidth + 1, roundingMode);
    }
    else {
        throw Error(`Unknown padding parameter: ${pad}`);
    }
    return { padInfo, outHeight, outWidth };
}
function get3DPadAndOutInfo(pad, inDepth, inHeight, inWidth, strideDepth, strideHeight, strideWidth, filterDepth, filterHeight, filterWidth, roundingMode) {
    let padInfo;
    let outDepth;
    let outHeight;
    let outWidth;
    if (typeof pad === 'number') {
        const padType = (pad === 0) ? 'VALID' : 'NUMBER';
        padInfo = {
            top: pad,
            bottom: pad,
            left: pad,
            right: pad,
            front: pad,
            back: pad,
            type: padType
        };
        const outShape = computeOutputShape4D([inDepth, inHeight, inWidth, 1], filterDepth, 1, strideDepth, pad, roundingMode);
        outDepth = outShape[0];
        outHeight = outShape[1];
        outWidth = outShape[2];
    }
    else if (pad === 'same') {
        outDepth = Math.ceil(inDepth / strideDepth);
        outHeight = Math.ceil(inHeight / strideHeight);
        outWidth = Math.ceil(inWidth / strideWidth);
        const padAlongDepth = (outDepth - 1) * strideDepth + filterDepth - inDepth;
        const padAlongHeight = (outHeight - 1) * strideHeight + filterHeight - inHeight;
        const padAlongWidth = (outWidth - 1) * strideWidth + filterWidth - inWidth;
        const front = Math.floor(padAlongDepth / 2);
        const back = padAlongDepth - front;
        const top = Math.floor(padAlongHeight / 2);
        const bottom = padAlongHeight - top;
        const left = Math.floor(padAlongWidth / 2);
        const right = padAlongWidth - left;
        padInfo = { top, bottom, left, right, front, back, type: 'SAME' };
    }
    else if (pad === 'valid') {
        padInfo = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            front: 0,
            back: 0,
            type: 'VALID'
        };
        outDepth = Math.ceil((inDepth - filterDepth + 1) / strideDepth);
        outHeight = Math.ceil((inHeight - filterHeight + 1) / strideHeight);
        outWidth = Math.ceil((inWidth - filterWidth + 1) / strideWidth);
    }
    else {
        throw Error(`Unknown padding parameter: ${pad}`);
    }
    return { padInfo, outDepth, outHeight, outWidth };
}
/**
 * Rounds a value depending on the rounding mode
 * @param value
 * @param roundingMode A string from: 'ceil', 'round', 'floor'. If none is
 *     provided, it will default to truncate.
 */
function round(value, roundingMode) {
    if (!roundingMode) {
        return Math.trunc(value);
    }
    switch (roundingMode) {
        case 'round':
            // used for Caffe Conv
            return Math.round(value);
        case 'ceil':
            // used for Caffe Pool
            return Math.ceil(value);
        case 'floor':
            return Math.floor(value);
        default:
            throw new Error(`Unknown roundingMode ${roundingMode}`);
    }
}
export function tupleValuesAreOne(param) {
    const [dimA, dimB, dimC] = parseTupleParam(param);
    return dimA === 1 && dimB === 1 && dimC === 1;
}
export function eitherStridesOrDilationsAreOne(strides, dilations) {
    return tupleValuesAreOne(strides) || tupleValuesAreOne(dilations);
}
/**
 * Convert Conv2D dataFormat from 'NHWC'|'NCHW' to
 *    'channelsLast'|'channelsFirst'
 * @param dataFormat in 'NHWC'|'NCHW' mode
 * @return dataFormat in 'channelsLast'|'channelsFirst' mode
 * @throws unknown dataFormat
 */
export function convertConv2DDataFormat(dataFormat) {
    if (dataFormat === 'NHWC') {
        return 'channelsLast';
    }
    else if (dataFormat === 'NCHW') {
        return 'channelsFirst';
    }
    else {
        throw new Error(`Unknown dataFormat ${dataFormat}`);
    }
}
//# sourceMappingURL=conv_util.js.map