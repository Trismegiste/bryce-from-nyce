import { expect, test, beforeEach, afterEach } from "bun:test";
import { TransfertFunction } from '../src/TransfertFunction.js';

let sut = null

beforeEach(() => {
    sut = new TransfertFunction(x => x ** 2, -2, 2)
})

test("Test creation", () => {
    expect(sut.xMin).toBe(-2)
    expect(sut.yMin).toBe(0)
    expect(sut.xMax).toBe(2)
    expect(sut.yMax).toBe(4)
})

test('Interpolate', () => {
    expect(sut.getY(0.5)).toBe(0)
})
