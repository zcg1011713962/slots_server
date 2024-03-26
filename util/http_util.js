const http = require('http');
const https = require('https');
const url = require('url');
class HTTPRequest {
    static async sendRequest(urlString, method = 'GET', body = null, headers = {}) {
        const parsedUrl = url.parse(urlString);
        const options = {
            method: method,
            headers: headers,
        };

        const protocol = parsedUrl.protocol || 'http:';
        const hostname = parsedUrl.hostname || 'localhost';
        const port = parsedUrl.port || (protocol === 'https:' ? 443 : 80);
        const path = parsedUrl.pathname || '/';
        const queryString = parsedUrl.query || '';

        const requestOptions = {
            ...options,
            protocol: protocol,
            hostname: hostname,
            port: port,
            path: path + (queryString ? '?' + queryString : ''),
        };

        return new Promise((resolve, reject) => {
            const client = protocol === 'https:' ? https : http;
            const req = client.request(requestOptions, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                res.on('end', () => {
                    resolve(responseData);
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            if (body) {
                req.write(body);
            }

            req.end();
        });
    }
}

module.exports = HTTPRequest;
