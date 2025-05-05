import React, { useState } from 'react';
import axios from 'axios'; // Using axios for API calls

// Import shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_ENDPOINT = 'https://ogas7wx3g3.execute-api.eu-central-1.amazonaws.com/calculate';

type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

interface ApiResponse {
  num1: string;
  num2: string;
  operation: Operation;
  result?: string | number; // result might be number or string (from Decimal)
  error?: string;
}

function App() {
  const [num1, setNum1] = useState<string>('');
  const [num2, setNum2] = useState<string>('');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // Allow only numbers and a single decimal point (basic validation)
      // More robust validation can be added
      const value = event.target.value;
      // Allow empty string, numbers, negative sign at start, one decimal point
      if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) {
        setter(value);
      }
    };

  const performCalculation = async (operation: Operation) => {
    setError(null); // Clear previous errors
    setResult(null); // Clear previous results
    setIsLoading(true);

    // Basic frontend validation
    if (num1.trim() === '' || num2.trim() === '') {
      setError("Please enter both numbers.");
      setIsLoading(false);
      return;
    }
    if (isNaN(parseFloat(num1)) || isNaN(parseFloat(num2))) {
      setError("Inputs must be valid numbers.");
      setIsLoading(false);
      return;
    }

    try {
      const headers: any = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      }
      const response = await axios.post<ApiResponse>(API_ENDPOINT, {
        num1: num1, // Send as strings, backend will parse
        num2: num2,
        operation: operation,
      }, { headers });

      console.log("API Response:", response.data); // Log successful response

      if (response.data.error) {
        // Handle errors returned successfully (e.g., division by zero)
        setError(response.data.error);
        setResult(response.data); // Store the response even if there's a handled error
      } else {
        setResult(response.data); // Store successful result
      }

    } catch (err: any) {
      console.error("API Call Failed:", err); // Log the error object
      if (axios.isAxiosError(err) && err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        // Try to extract error message from backend response
        const backendError = err.response.data?.error || `Request failed with status ${err.response.status}`;
        setError(backendError);
        // Store partial input data if available in error response
        if (err.response.data?.input) {
          setResult({ // Use result state to show echoed input on error
            num1: err.response.data.input.num1 ?? num1,
            num2: err.response.data.input.num2 ?? num2,
            operation: err.response.data.input.operation ?? operation,
            error: backendError
          });
        }

      } else if (err.request) {
        // The request was made but no response was received
        setError("Network error: Could not reach the API server.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`An unexpected error occurred: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cloud Calculator</CardTitle>
          <CardDescription>Perform basic arithmetic using an AWS Lambda backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="num1">Number 1</Label>
            <Input
              id="num1"
              type="text" // Use text to allow '-', '.', but handle validation
              placeholder="Enter first number"
              value={num1}
              onChange={handleInputChange(setNum1)}
              disabled={isLoading}
              inputMode="decimal" // Hint for mobile keyboards
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="num2">Number 2</Label>
            <Input
              id="num2"
              type="text"
              placeholder="Enter second number"
              value={num2}
              onChange={handleInputChange(setNum2)}
              disabled={isLoading}
              inputMode="decimal"
            />
          </div>
          <div className="flex justify-center space-x-2 pt-2">
            <Button onClick={() => performCalculation('add')} disabled={isLoading} variant="outline">Add (+)</Button>
            <Button onClick={() => performCalculation('subtract')} disabled={isLoading} variant="outline">Subtract (-)</Button>
            <Button onClick={() => performCalculation('multiply')} disabled={isLoading} variant="outline">Multiply (*)</Button>
            <Button onClick={() => performCalculation('divide')} disabled={isLoading} variant="outline">Divide (/)</Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-2">
          {isLoading && <p className="text-blue-600 dark:text-blue-400">Calculating...</p>}

          {/* Display Error */}
          {error && !isLoading && (
            <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
              {/* Optionally show input context if available */}
              {result?.num1 && (<p className="text-sm mt-1">Input: {result.num1} {result.operation} {result.num2}</p>)}
            </div>
          )}


          {/* Display Result */}
          {result && !result.error && !isLoading && (
            <div className="w-full p-3 bg-green-100 border border-green-400 text-green-800 rounded">
              <p className="font-bold">Result:</p>
              <p>{result.num1} {result.operation} {result.num2} = <span className="font-semibold">{result.result}</span></p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;