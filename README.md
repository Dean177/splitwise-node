splitwise-node
===========

[![Circle CI](https://circleci.com/gh/Dean177/splitwise-node.svg?style=svg)](https://circleci.com/gh/Dean177/splitwise-node)

A javascript wrapper for the Splitwise API.
This is still under active development, and the api presented may change wildly until the first version is published.

Install with npm 

```sh
npm install splitwise-node
```

## Usage

1. Get your ConsumerToken and ConsumerSecret from [Splitwise](https://secure.splitwise.com/apps)
2. Provide these as environment variables to you application
3. Get an authorization url to send your user to.
```javascript
var AuthApi = require('splitwise-node');

var userOAuthToken, userOAuthTokenSecret;
var authApi = new AuthApi(ConsumerKey, ConsumerSecret);
var userAuthUrl = authApi.getOAuthRequestToken()
    .then(({ oAuthToken, oAuthTokenSecret }) => {
        var [userOAuthToken, userOAuthTokenSecret] = [oAuthToken, oAuthTokenSecret];
        return api.getUserAuthorisationUrl(oAuthToken);
    });
```

4. Get your user to authorize your token by visiting the authorization url
![User authorization screenshot](docs/images/user-auth-screenshot.png)

5. Now you can api away
```javascript
var splitwiseApi = authApi.getSplitwiseApi(userOAuthToken, userOAuthTokenSecret);

```

## License

[MIT](LICENSE)
