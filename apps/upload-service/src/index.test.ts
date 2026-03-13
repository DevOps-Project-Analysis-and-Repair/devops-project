
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import assert from "node:assert";
import { describe, it } from "node:test";
import { handler } from ".";


describe('Router handler', () => {
    it('should return true on GET /fix/health', async () => {
        const mockEvent: APIGatewayProxyEvent = {
            httpMethod: 'GET',
            path: '/fix/health',         // matches your route
            headers: {},
            resource: '',
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: null,
            stageVariables: null,
            requestContext: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any

            body: null,
            isBase64Encoded: false,
        };
        const context = {} as unknown as Context;

        const response = await handler(mockEvent, context);
        assert.strictEqual(response.statusCode, 200);
        const body = JSON.parse(response.body || 'null');
        assert.strictEqual(Boolean(body), true);
    });
});