import json
import decimal


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return str(obj)
        return json.JSONEncoder.default(self, obj)


def calculate(num1_str, num2_str, operation):
    """Performs the arithmetic calculation."""
    errors = []
    result = None
    num1 = None
    num2 = None

    try:
        num1 = decimal.Decimal(num1_str)
        num2 = decimal.Decimal(num2_str)
    except (decimal.InvalidOperation, TypeError, ValueError):
        errors.append("Invalid input: num1 and num2 must be valid numbers.")
        return None, errors

    # Perform operation
    if operation == 'add':
        result = num1 + num2
    elif operation == 'subtract':
        result = num1 - num2
    elif operation == 'multiply':
        result = num1 * num2
    elif operation == 'divide':
        if num2 == 0:
            errors.append("Division by zero is not allowed.")
        else:
            # Ensure division results in a Decimal
            result = num1 / num2
    else:
        errors.append(
            f"Invalid operation: '{operation}'. Supported operations are add, subtract, multiply, divide.")

    return result, errors


def lambda_handler(event, context):
    """AWS Lambda handler function."""
    print(
        # Log the incoming event for debugging
        f"Received event: {json.dumps(event)}")
    request_context = event.get('requestContext', {})
    if not request_context:
        return {
            'statusCode': 400,
            'headers': response_headers,
            'body': json.dumps({'error': 'Invalid request context.'})
        }

    http_method = request_context["http"]["method"].upper()
    response_headers = {
        # Required for CORS support to enable frontend interaction
        'Access-Control-Allow-Origin': '*',  # Allow requests from any origin
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
    }

    num1_str = None
    num2_str = None
    operation = None

    try:
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': response_headers,
                'body': ''
            }
        elif http_method == 'GET':
            params = event.get('queryStringParameters')
            if params:
                num1_str = params.get('num1')
                num2_str = params.get('num2')
                operation = params.get('operation')
            else:
                return {
                    'statusCode': 400,
                    'headers': response_headers,
                    'body': json.dumps({'error': 'Missing query parameters: num1, num2, operation are required for GET requests.'})
                }

        elif http_method == 'POST':
            if event.get('body'):
                try:
                    body = json.loads(event['body'])
                    num1_str = body.get('num1')
                    num2_str = body.get('num2')
                    operation = body.get('operation')
                except json.JSONDecodeError:
                    return {
                        'statusCode': 400,
                        'headers': response_headers,
                        'body': json.dumps({'error': 'Invalid JSON format in request body.'})
                    }
            else:
                return {
                    'statusCode': 400,
                    'headers': response_headers,
                    'body': json.dumps({'error': 'Missing request body for POST requests.'})
                }
        else:
            return {
                'statusCode': 405,
                'headers': response_headers,
                'body': json.dumps({'error': f'Unsupported HTTP method: {http_method}'})
            }

        # --- Input Validation ---
        if not all([num1_str, num2_str, operation]):
            missing = [k for k, v in {
                'num1': num1_str, 'num2': num2_str, 'operation': operation}.items() if not v]
            return {
                'statusCode': 400,
                'headers': response_headers,
                'body': json.dumps({'error': f'Missing required input(s): {", ".join(missing)}'})
            }

        # --- Perform Calculation ---
        result, errors = calculate(num1_str, num2_str, operation.lower())

        # --- Format Response ---
        if errors:
            response_payload = {
                'error': '; '.join(errors),
                'input': {
                    'num1': num1_str,
                    'num2': num2_str,
                    'operation': operation
                }
            }
            status_code = 400  # Bad Request for calculation/validation errors
        else:
            response_payload = {
                'num1': num1_str,
                'num2': num2_str,
                'operation': operation.lower(),
                'result': result
            }
            status_code = 200  # OK

        return {
            'statusCode': status_code,
            'headers': response_headers,
            # Use DecimalEncoder to handle Decimal objects
            'body': json.dumps(response_payload, cls=DecimalEncoder)
        }

    except Exception as e:
        # Catch-all for unexpected server errors
        print(f"Internal server error: {e}")  # Log the error
        return {
            'statusCode': 500,
            'headers': response_headers,
            'body': json.dumps({'error': 'Internal server error occurred.'})
        }
