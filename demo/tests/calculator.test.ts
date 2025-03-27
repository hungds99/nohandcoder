import { Calculator } from "../src/calculator";

describe("Calculator", () => {
  const calculator = new Calculator();

  test("adds two numbers correctly", () => {
    expect(calculator.add(2, 3)).toBe(5);
    expect(calculator.add(-1, 1)).toBe(0);
  });

  test("subtracts two numbers correctly", () => {
    expect(calculator.subtract(5, 3)).toBe(2);
    expect(calculator.subtract(1, 1)).toBe(0);
  });

  test("multiplies two numbers correctly", () => {
    expect(calculator.multiply(2, 3)).toBe(6);
    expect(calculator.multiply(-2, 3)).toBe(-6);
  });

  test("divides two numbers correctly", () => {
    expect(calculator.divide(6, 2)).toBe(3);
    expect(calculator.divide(5, 2)).toBe(2.5);
  });

  test("throws error when dividing by zero", () => {
    expect(() => calculator.divide(1, 0)).toThrow(
      "Division by zero is not allowed"
    );
  });
});
