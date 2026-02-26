// Inside your main server file (where routes are defined):

const SPEC_URL = process.env.OPENAPI_SPEC_URL || 'http://localhost:8000/openapi.json';

// The HTML content to serve (this would typically be loaded from a template file)
const redocViewerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>E-Fuldmagt API Documentation</title>
        </head>
    <body>
        <div id="redoc-container"></div>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        <script>
            Redoc.init(
                '${SPEC_URL}', // This points to the JSON endpoint you created in step 2
                {},
                document.getElementById('redoc-container')
            );
        </script>
    </body>
    </html>
`;

module.exports = { redocViewerHtml };