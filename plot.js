---
---
// This file is part of Integration by me.
//
// Copyright (C) 2015 Chen-Pang He <http://jdh8.org/>
//
// Integration by me is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Integration by me is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

/**
 * @summary Numberical function
 *
 * @callback MoveTangent~Function
 *
 * @param {number} x
 *
 * @returns {number}
 */

/**
 * @class MoveTangent~Element
 *
 * @augments Element
 */

/**
 * @summary Derivative of the curve function
 *
 * @member {MoveTangent~Function?} MoveTangent~Element#slope
 */

/**
 * @summary The function of the curve
 *
 * @member {MoveTangent~Function?} MoveTangent~Element#curve
 */

/**
 * @summary Event handler
 *
 * @callback MoveTangent~Handler
 *
 * @param {Event} ev  The event
 */

/**
 * @summary Curried event handler
 *
 * @callback MoveTangent~CurriedHandler
 *
 * @param {MoveTangent~Element} handler  The handler element
 *
 * @returns {MoveTangent~Handler}
 */

/**
 * @summary Move a line as to the tangent on the curve.
 *
 * @param {SVGLineElement} line  The line to be moved
 *
 * @returns {MoveTangent~Handler}
 */
function MoveTangent(line)
{
	"use strict"; 

	/**
	 * @summary Return a constant function
	 *
	 * @param {number} value
	 *
	 * @returns {MoveTangent~Function}
	 */
	function Constant(value)
	{
		return function()
		{
			return value;
		}
	}

	/**
	 * @summary Return a SVGPoint at given position.
	 *
	 * @param {number} x
	 * @param {number} y
	 *
	 * @returns {SVGPoint}
	 */
	function Point(x, y)
	{
		var point = line.ownerSVGElement.createSVGPoint();

		point.x = x;
		point.y = y;

		return point;
	}

	/**
	 * @summary Get the center of the circle.
	 *
	 * @param {SVGCircleElement} circle
	 *
	 * @returns {SVGPoint}
	 */
	function CenterOfCircle(circle)
	{
		return Point(circle.cx.animVal.value, circle.cy.animVal.value);
	}

	/**
	 * @summary Construct point from clientX and clientY
	 *
	 * @param {Event} ev
	 *
	 * @returns {SVGPoint}
	 */
	function ClientPoint(ev)
	{
		return Point(ev.clientX, ev.clientY);
	}

	/**
	 * @summary Get ev point in {@link line} coordinate
	 *
	 * @param {Event} ev
	 *
	 * @returns {SVGPoint}
	 */
	function LinePoint(ev)
	{
		if (ev.target instanceof SVGCircleElement) {
			return CenterOfCircle(ev.target) // in ev.target coordinate
				.matrixTransform(ev.target.getTransformToElement(line));
		}
		else {
			return ClientPoint(ev) // in client coordinate
				.matrixTransform(line.getScreenCTM().inverse());
		}
	}

	/**
	 * <script>
	 *   var MathJax = {
	 *     TeX: {
	 *	     Macros: {
	 *	       Parametric: "\\begin{bmatrix}\
	 *             a & * & e \\\\\
	 *             b & * & f\
	 *           \\end{bmatrix}",
	 *       },
	 *	     equationNumbers: { autoNumber: "AMS" },
	 *     },
	 *     MMLorHTML: { prefer: { Firefox: "MML" } },
	 *   };
	 * </script>
	 * <script async src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
	 *
	 * This function returns a matrix
	 *
	 * \[ \Parametric \]
	 *
	 * such that
	 *
	 * \[
	 *	 \Parametric \begin{bmatrix} t \\ 0 \\ 1 \end{bmatrix}
	 *   = \begin{bmatrix} x \\ y \end{bmatrix}.
	 * \]
	 *
	 * @summary Transform point-slope equation into parametric equation.
	 *
	 * @param {SVGPoint} point
	 * @param {number}   slope
	 *
	 * @returns {SVGMatrix}
	 */
	function ParametricMatrix(point, slope)
	{
		var result = line.ownerSVGElement.createSVGMatrix();

		result.b = slope;
		result.e = point.x;
		result.f = point.y;

		return result;
	}

	/**
	 * The coefficients of the general equation are in the lower row.
	 *
	 * @summary Convert a parametric equation to general one.
	 *
	 * @param {SVGMatrix} parametric  The parametric equation
	 *
	 * @returns {SVGMatrix}  The general equation
	 */
	function GeneralMatrix(parametric)
	{
		var general = line.ownerSVGElement.createSVGMatrix();

		general.b = parametric.b;
		general.d = -parametric.a;
		general.f = parametric.a * parametric.f - parametric.b * parametric.e;

		return general;
	}

	/**
	 * @summary Given a linear equation, find x at some y.
	 *
	 * @param {SVGMatrix} matrix  General linear equation
	 * @param {number}    y       The value of y
	 *
	 * @returns {SVGPoint}  The point (x, y)
	 */
	function findX(matrix, y)
	{
		return Point(-(matrix.d * y + matrix.f) / matrix.b, y);
	}

	/**
	 * @summary Given a linear equation, find y at some x.
	 *
	 * @param {SVGMatrix} matrix  General linear equation
	 * @param {number}    x       The value of x
	 *
	 * @returns {SVGPoint}  The point (x, y)
	 */
	function findY(matrix, x)
	{
		return Point(x, -(matrix.b * x + matrix.f) / matrix.d);
	}

	/**
	 * @summary Solve endpoints in viewport coordinate.
	 *
	 * @param {SVGMatrix} matrix  General linear equation
	 * @param {SVGRect}   box     The boundary box
	 *
	 * @returns {SVGPoint[]}  Endpoints
	 */
	function solve(matrix, box)
	{
		// Bound vertically
		if (box.height * Math.abs(matrix.d) < box.width * Math.abs(matrix.b))
			return [findX(matrix, box.y), findX(matrix, box.y + box.height)];
		
		// Bound horizontally
		return [findY(matrix, box.x), findY(matrix, box.x + box.width)];
	}

	/**
	 * @summary Get new endpoints from a point in line coordinate.
	 *
	 * @param {SVGPoint} point
	 * @param {MoveTangent~Function} slope
	 *
	 * @returns {SVGPoint[]}  New endpoints for the line
	 */
	function getEndpoints(point, slope)
	{
		var viewbox = line.viewportElement.viewBox.animVal;
		var transform = line.getTransformToElement(line.viewportElement);
		var inverse = transform.inverse();

		var parametric = ParametricMatrix(point, slope(point.x));
		var general = GeneralMatrix(transform.multiply(parametric));

		return solve(general, viewbox).map(function(point)
		{
			return point.matrixTransform(inverse);
		});
	}

	/**
	 * @summary Set new endpoints to the line.
	 *
	 * @this {SVGLineElement}
	 *
	 * @param {SVGPoint} first   The first endpoint
	 * @param {SVGPoint} second  The second endpoint
	 */
	function setEndpoints(first, second)
	{
		this.setAttribute("x1", first.x);
		this.setAttribute("y1", first.y);
		this.setAttribute("x2", second.x);
		this.setAttribute("y2", second.y);
	}

	return function(/** @constant {MoveTangent~Element} */ handler)
	{
		/** @constant {MoveTangent~Function} */
		var slope = handler.slope || Constant(+handler.getAttribute("slope"));

		/** @constant {MoveTangent~Function} */
		var curve = handler.curve;

		return function(/** @constant {Event} */ ev)
		{
			var point = LinePoint(ev);

			if (curve)
				point.y = curve(point.x);

			setEndpoints.apply(line, getEndpoints(point, slope));
		}
	}
}

(function()
{
	/**
	 * A local IRI starts with "#", localizing an element in the same document.
	 *
	 * @summary Resolve local IRI in an XLink attribute.
	 *
	 * @param {Element} src   The source element
	 * @param {string}  name  The local name of the attribute, e.g. "href"
	 *
	 * @returns {Element}  The target element
	 */
	function XLinkTarget(src, name)
	{
		var iri = src.getAttributeNS("http://www.w3.org/1999/xlink", name);

		if (iri && iri[0] === "#")
			return document.getElementById(iri.substr(1));
			
		return null;
	}

	function makeEventElement(element, handler)
	{
		var observer = element.parentNode;

		element.getAttribute("event").split(/\s+/).forEach(function(type)
		{
			observer.addEventListener(type, handler);
		});
	}

	/** @constant */
	var plot = "https://jdh8.github.io/js/plot.js";

	/** @type CSSStyleSheet */
	var deco = (function()
	{
		var element = document.createElementNS("http://www.w3.org/2000/svg", "style");

		document.documentElement.appendChild(element);

		var sheets = document.styleSheets;

		return sheets[sheets.length - 1];
	})();

	Array.forEach(document.getElementsByClassName("movable"), function(movable)
	{
		movable.move = MoveTangent(movable);
	});

	Array.forEach(document.getElementsByTagNameNS(plot, "MoveTangent"), function(element)
	{
		makeEventElement(element, XLinkTarget(element, "href").move(element));
	});

	Array.forEach(document.getElementsByTagNameNS(plot, "Decorate"), function(element)
	{
		var rule = element.textContent;

		makeEventElement(element, function()
		{
			deco.insertRule(rule, deco.cssRules.length);
		});
	});
})();
