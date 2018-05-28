(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.Stats = factory());
}(this, (function () { 'use strict';

    /**
     * @author mrdoob / http://mrdoob.com/
     */

    let Stats = function () {
        let container = document.createElement( 'div' );
        container.style.cssText = 'position:fixed;opacity:0.9;z-index:10000';

        //

        function addPanel( panel ) {

            container.appendChild( panel.dom );
            return panel;

        }

        function showPanel( id ) {
            for ( let i = 0; i < container.children.length; i ++ ) {
                if (i === id) {
                    container.children[i].style.display = 'block';
                }
            }
        }

        function hidePanel( id ) {
            for ( let i = 0; i < container.children.length; i ++ ) {
                if (i === id) {
                    container.children[i].style.display = 'none';
                }
            }
        }

        //

        let beginTime = ( performance || Date ).now(), prevTime = beginTime, frames = 0;

        let fpsPanel = addPanel( new Stats.Panel( 'FPS', '#0ff', '#002' ) );
        let msPanel = addPanel( new Stats.Panel( 'ms render', '#0f0', '#020' ) );

        return {

            REVISION: 16,

            dom: container,

            addPanel: addPanel,
            showPanel: showPanel,

            begin: function () {

                beginTime = ( performance || Date ).now();

            },

            end: function () {

                frames ++;

                let time = ( performance || Date ).now();

                msPanel.update( time - beginTime, 200 );

                if ( time > prevTime + 1000 ) {

                    fpsPanel.update( ( frames * 1000 ) / ( time - prevTime ), 100 );

                    prevTime = time;
                    frames = 0;

                }

                return time;

            },

            update: function () {

                beginTime = this.end();

            },

            // Backwards Compatibility

            domElement: container,

        };

    };

    Stats.Panel = function ( name, fg, bg ) {

        let min = Infinity, max = 0, round = Math.round;
        let PR = round( window.devicePixelRatio || 1 );

        let WIDTH = 120 * PR, HEIGHT = 48 * PR,
            TEXT_X = 4.5 * PR, TEXT_Y = 2 * PR,
            GRAPH_X = 4.5 * PR, GRAPH_Y = 15 * PR,
            GRAPH_WIDTH = 111 * PR, GRAPH_HEIGHT = 30 * PR;

        let canvas = document.createElement( 'canvas' );
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        canvas.style.cssText = 'width:120px;height:48px';

        let context = canvas.getContext( '2d' );
        context.font = 'bold ' + ( 9 * PR ) + 'px Helvetica,Arial,sans-serif';
        context.textBaseline = 'top';

        context.fillStyle = bg;
        context.fillRect( 0, 0, WIDTH, HEIGHT );

        context.fillStyle = fg;
        context.fillText( name, TEXT_X, TEXT_Y );
        context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

        context.fillStyle = bg;
        context.globalAlpha = 0.9;
        context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

        return {

            dom: canvas,

            update: function ( value, maxValue ) {

                min = Math.min( min, value );
                max = Math.max( max, value );

                context.fillStyle = bg;
                context.globalAlpha = 1;
                context.fillRect( 0, 0, WIDTH, GRAPH_Y );
                context.fillStyle = fg;
                context.fillText( round( value ) + ' ' + name + ' (' + round( min ) + '-' + round( max ) + ')', TEXT_X, TEXT_Y );

                context.drawImage( canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT );

                context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT );

                context.fillStyle = bg;
                context.globalAlpha = 0.9;
                context.fillRect( GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, round( ( 1 - ( value / maxValue ) ) * GRAPH_HEIGHT ) );

            }

        };

    };

    return Stats;

})));