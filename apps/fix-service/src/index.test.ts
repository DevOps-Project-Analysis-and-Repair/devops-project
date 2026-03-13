import { describe, expect, it } from '@jest/globals';
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
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
            requestContext: {} as any,   // can be empty for tests
            body: null,
            isBase64Encoded: false,
        };
        const context = {} as unknown as Context;

        const response = await handler(mockEvent, context);
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body || 'null');
        expect(Boolean(body)).toBe(true);
    });
});