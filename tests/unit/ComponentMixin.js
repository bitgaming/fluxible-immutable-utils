/*globals describe,it,beforeEach,afterEach*/

'use strict';

var jsx = require('jsx-test');
var expect = require('chai').expect;
var React = require('react');
var sinon = require('sinon');
var Immutable = require('immutable');
var ImmutableMixin = require('../../src/createComponentMixin')();

describe('ImmutableMixin component functions', function () {
    describe('#objectsToIgnore', function () {
        beforeEach(function () {
            sinon.spy(console, 'warn');
        });

        afterEach(function () {
            console.warn.restore();
        });

        it('should bypass certain props fields if are ignored', function () {
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [ImmutableMixin],
                ignoreImmutableCheck: {
                    props: {
                        data: true
                    }
                },
                render: function () {
                    return null;
                }
            });

            jsx.renderComponent(Component, {data: {list: [1, 2, 3]}});
            expect(console.warn.callCount).to.equal(0);
        });

        it('should ignore certain props/state fields if they are marked SKIP_SHOULD_UPDATE', function () {
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [ImmutableMixin],
                ignoreImmutableCheck: {
                    props: {
                        data: 'SKIP_SHOULD_UPDATE'
                    }
                },
                render: function () {
                    return null;
                }
            });
            var props = {
                data: true
            };
            var component = jsx.renderComponent(Component, {data: {}});
            expect(component.shouldComponentUpdate(props, {})).to.equal(false);
            expect(console.warn.callCount).to.equal(0);
        });

        it('should apply configs if we use createComponentMixn', function () {
            var config = {
                ignoreImmutableCheck: {
                    props: {
                        data: 'SKIP_SHOULD_UPDATE'
                    },
                    state: {
                        foo: true
                    }
                }
            };
            var CustomImmutableMixin = require('../../src/createComponentMixin')(config);
            var state = {
                foo: {},
                baz: {}
            };
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [CustomImmutableMixin],
                render: function () {
                    return null;
                },
                getStateOnChange: function () {
                    return state;
                }
            });
            var props = {
                data: {}
            };
            var component = jsx.renderComponent(Component, {data: false});
            expect(component.shouldComponentUpdate(props, state)).to.equal(false);
            expect(console.warn.callCount).to.equal(1);
        });

        it('should warn certain if next state is mutable', function (done) {
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [ImmutableMixin],
                render: function () {
                    return null;
                }
            });

            var comp = jsx.renderComponent(Component, {});
            comp.setState({testData: {list: [1, 2, 3]}}, function () {
                expect(
                    console.warn.calledWith('WARN: component: MyComponent received non-immutable object: testData')
                ).to.equal(true);
                done();
            });
        });

        it('should never warn if ignoreAllWarnings is true', function (done) {
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [ImmutableMixin],
                statics: {
                    ignoreAllWarnings: true
                },
                render: function () {
                    return null;
                }
            });

            var comp = jsx.renderComponent(Component, {});
            comp.setState({testData: {list: [1, 2, 3]}}, function () {
                expect(console.warn.callCount).to.equal(0);
                done();
            });
        });


        it('should bypass certain state fields if are ignored', function (done) {
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [ImmutableMixin],
                ignoreImmutableCheck: {
                    state: {
                        testData: true
                    }
                },
                render: function () {
                    return null;
                }
            });

            var comp = jsx.renderComponent(Component, {});
            comp.setState({testData: {list: [1, 2, 3]}}, function () {
                expect(console.warn.callCount).to.equal(0);
                done();
            });
        });

        it('should merge w/ default certain state fields if are ignored', function (done) {
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [ImmutableMixin],
                ignoreImmutableCheck: {
                    state: {
                        testData: true
                    }
                },
                render: function () {
                    return React.createElement('div', {}, this.props.children);
                }
            });

            var comp = jsx.renderComponent(Component, {}, ['foo', 'bar']);
            comp.setState({testData: {list: [1, 2, 3]}}, function () {
                expect(console.warn.callCount).to.equal(0);
                done();
            });
        });
    });

    describe('#componentWillMount', function () {
        beforeEach(function () {
            sinon.spy(console, 'warn');
        });

        afterEach(function () {
            console.warn.restore();
        });

        it('should raise warnings if non immutable props are passed', function () {
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [ImmutableMixin],
                render: function () {
                    return null;
                }
            });

            jsx.renderComponent(Component, {data: {list: [1, 2, 3]}});
            expect(
                console.warn.calledWith('WARN: component: MyComponent received non-immutable object: data')
            ).to.equal(true);
        });

        it('should not raise warnings for children', function () {
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [ImmutableMixin],
                render: function () {
                    return React.createElement('div', {}, this.props.children);
                }
            });

            jsx.renderComponent(Component, {}, ['foo', 'bar']);
            expect(console.warn.callCount).to.equal(0);
        });

        it('does not raise warning if props or state is null', function () {
            var Component = React.createClass({
                displayName: 'MyComponent',
                mixins: [ImmutableMixin],
                getInitialState: function () {
                    return null;
                },
                getStateOnChange: function () {
                    return null;
                },
                render: function () {
                    return null;
                }
            });

            jsx.renderComponent(Component, null);
            expect(console.warn.callCount).to.equal(0);
        });

        it('should raise warkings if there are non immutable states', function () {
            var Component = React.createClass({
                displayName: 'YComponent',
                mixins: [ImmutableMixin],
                getInitialState: function () {
                    return {list: [1, 2, 3]};
                },
                render: function () {
                    return null;
                }
            });

            jsx.renderComponent(Component, {});
            expect(
                console.warn.calledWith('WARN: component: YComponent received non-immutable object: list')
            ).to.equal(true);
        });
    });

    describe('#getStateOnChange', function () {
        it('should merge the getInitialState with getStateOnChange', function () {
            var Component = React.createClass({
                mixins: [ImmutableMixin],
                getStateOnChange: function () {
                    return {foo: 'bar'};
                },
                getInitialState: function () {
                    return {bar: 'foo'};
                },
                render: function () {
                    return null;
                }
            });

            var component = jsx.renderComponent(Component, {});

            expect(component.state).to.deep.equal({
                bar: 'foo',
                foo: 'bar'
            });
        });

        it('should call getStateOnChange to initialize state', function (done) {
            var Component = React.createClass({
                mixins: [ImmutableMixin],
                getStateOnChange: function () {
                    done();
                    return {};
                },
                render: function () {
                    return null;
                }
            });

            jsx.renderComponent(Component, {});
        });

        it('shouldn\'t crash if getStateOnChange is not there', function () {
            var Component = React.createClass({
                mixins: [ImmutableMixin],
                render: function () {
                    return null;
                }
            });
            var component = jsx.renderComponent(Component, {});

            // This shouldn't throw
            component.onChange({foo: 'bar'});
        });

        it('should pass onChange arguments to getStateOnChange', function () {
            var Component = React.createClass({
                mixins: [ImmutableMixin],
                getStateOnChange: function (data) {
                    return data || {};
                },
                render: function () {
                    return null;
                }
            });

            var component = jsx.renderComponent(Component, {});
            component.onChange({foo: 'bar'});
            expect(component.state).to.deep.equal({foo: 'bar'});
        });
    });

    describe('#shouldComponentUpdate', function () {
        var component;
        var props;
        var state;

        beforeEach(function () {
            props = {foo: 'bar', list: Immutable.fromJS(['baz', 'foo'])};
            state = {list: Immutable.fromJS(['baz', 'foo'])};

            var Component = React.createClass({
                mixins: [ImmutableMixin],
                getStateOnChange: function () {
                    return state;
                },
                render: function () {
                    return null;
                }
            });

            component = jsx.renderComponent(Component, props);
        });

        function assertComponentUpdate(newProps, newState, expected) {
            expect(
                component.shouldComponentUpdate(newProps, newState)
            ).to.equal(expected);
        }

        it('should return false if props/state are equal', function () {
            assertComponentUpdate(props, state, false);
            assertComponentUpdate({foo: 'bar', list: props.list}, state, false);
            assertComponentUpdate(props, {list: state.list}, false);
        });

        it('should return true if a current prop value is changed', function () {
            assertComponentUpdate({foo: 'fubar', list: props.list}, state, true);
            assertComponentUpdate({foo: 'bar', list: state.list}, state, true);
            assertComponentUpdate({}, state, true);
        });

        it('should return true if a new prop value is added', function () {
            assertComponentUpdate(props, state, false);
            props.test = 'baz';
            assertComponentUpdate(props, state, true);
        });

        it('should return true if a new prop value is removed', function () {
            assertComponentUpdate(props, state, false);
            delete props.foo;
            assertComponentUpdate(props, state, true);
        });

        it('should return true if state is changed', function () {
            assertComponentUpdate(props, {list: props.list}, true);
            assertComponentUpdate(props, {foo: 'bar', list: state.list}, true);
        });

        it('allows the shouldComponentUpdate to be overridden', function () {
            var Component = React.createClass({
                mixins: [ImmutableMixin],
                shouldComponentUpdate: function () {
                    return 'override';
                },
                render: function () {
                    return null;
                }
            });

            component = jsx.renderComponent(Component, props);
            assertComponentUpdate({}, {}, 'override');
        });
    });
});
