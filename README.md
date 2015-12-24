splitwise-node
===========

## DO NOT USE
This is still under active development, and the api presented may change wildly until the first version is published.

A javascript wrapper for the Splitwise API.

Install with npm 

```sh
npm install splitwise-node
```

## Usage

Get token and secret from [Splitwise]
If being used in an opensource project be sure not to commit these to you repository. Maybe add these to your .gitignore

```js
import { SplitWiseApi, } from 'splitwise-node';

const api = new SplitwiseApi(consumerToken, consumerSecret);

api.getAuthorizationLink();

const userApi = new UserApi(api, oAuthToken, oAuthSecret);

userApi.doAThing();

```

## License

[MIT](LICENSE)
