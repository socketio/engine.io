TESTS = test/functional/*.js
BENCHMARKS = $(shell find bench -type f ! -name 'runner.js')
REPORTER = dot

test:
	@./node_modules/.bin/mocha \
		--require support/common \
		--reporter $(REPORTER) \
		--slow 500ms \
		--bail \
		--globals ___eio,document \
		$(TESTS)

test-cloud:
	@NODE_PATH=`pwd`/support:`pwd`/test \
	node \
		support/runCloud.js 

test-local:
	@NODE_PATH=`pwd`/support:`pwd`/test \
	node \
		support/runLocal.js

build-test:
	@make -C test build
	@make -C test build-clean

build-clean: 
	@make -C test build-clean

test-cov: lib-cov
	EIO_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	jscoverage --no-highlight lib lib-cov

bench:
	@node $(PROFILEFLAGS) bench/runner.js $(BENCHMARKS)

.PHONY: test test-cov bench
