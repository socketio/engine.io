## [3.6.1](https://github.com/socketio/engine.io/compare/3.6.0...3.6.1) (2022-11-20)


### Bug Fixes

* catch errors when destroying invalid upgrades ([83c4071](https://github.com/socketio/engine.io/commit/83c4071af871fc188298d7d591e95670bf9f9085))



# [3.6.0](https://github.com/socketio/engine.io/compare/3.5.0...3.6.0) (2022-06-06)


### Bug Fixes

* add extension in the package.json main entry ([#608](https://github.com/socketio/engine.io/issues/608)) ([3ad0567](https://github.com/socketio/engine.io/commit/3ad0567dbd57cfb7c2ff4e8b7488d80f37022b4a))
* do not reset the ping timer after upgrade ([1f5d469](https://github.com/socketio/engine.io/commit/1f5d4699862afee1e410fcb0e1f5e751ebcd2f9f)), closes [/github.com/socketio/socket.io-client-swift/pull/1309#issuecomment-768475704](https://github.com//github.com/socketio/socket.io-client-swift/pull/1309/issues/issuecomment-768475704)


### Features

* decrease the default value of maxHttpBufferSize ([58e274c](https://github.com/socketio/engine.io/commit/58e274c437e9cbcf69fd913c813aad8fbd253703))

This change reduces the default value from 100 mb to a more sane 1 mb.

This helps protect the server against denial of service attacks by malicious clients sending huge amounts of data.

See also: https://github.com/advisories/GHSA-j4f2-536g-r55m

* increase the default value of pingTimeout ([f55a79a](https://github.com/socketio/engine.io/commit/f55a79a28a5fbc6c9edae876dd11308b89cc979e))



# [3.5.0](https://github.com/socketio/engine.io/compare/3.4.2...3.5.0) (2020-12-30)


### Features

* add support for all cookie options ([19cc582](https://github.com/socketio/engine.io/commit/19cc58264a06dca47ed401fbaca32dcdb80a903b)), closes [/github.com/jshttp/cookie#options-1](https://github.com//github.com/jshttp/cookie/issues/options-1)
* disable perMessageDeflate by default ([5ad2736](https://github.com/socketio/engine.io/commit/5ad273601eb66c7b318542f87026837bf9dddd21))



## [3.4.2](https://github.com/socketio/engine.io/compare/3.4.1...3.4.2) (2020-06-04)


### Bug Fixes

* remove explicit require of uws ([85e544a](https://github.com/socketio/engine.io/commit/85e544afd95a5890761a613263a5eba0c9a18a93))



## [3.4.1](https://github.com/socketio/engine.io/compare/3.4.0...3.4.1) (2020-04-17)


### Bug Fixes

* ignore errors when forcefully closing the socket ([da851ec](https://github.com/socketio/engine.io/commit/da851ec4ec89d96df2ee5c711f328b5d795423e9))
* use SameSite=Strict by default ([001ca62](https://github.com/socketio/engine.io/commit/001ca62cc4a8f511f3b2fbd9e4493ad274a6a0e5))



