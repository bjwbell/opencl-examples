function clClosestPair (points, print_output, return_timing_info) {
    points = points.slice(0);
    // All output is written to element by id "output"
    var output = document.getElementById("output");
    //output.innerHTML = "";
    try 
    {
	// Generate input vectors
	var numPoints = points.length;
	var pointsByX = new Uint32Array(numPoints          * 4); // * 4 since pointsByX is uint3 OpenCL type which is of size 4 * sizeof(uint) per the OpenCL spec.
	var pointsByY = new Uint32Array(numPoints          * 4); // ""
	var diffs     = new Uint32Array(Math.floor((numPoints + 1)/2)  * 4); // * 4 since diffs is a 4 field structure
	var strips    = new Uint32Array(numPoints * 2      * 2);

	// Create points
	if (print_output == undefined)
	{
	    output.innerHTML += "<br/>Num Points: " + numPoints + "<br/>";
	}

	// Populate pointsByX
 	// sort by x-coordinate
	points.sort(function (a,b){return a[0] - b[0];});
	if (print_output == undefined)
	{
	    output.innerHTML += "points:";
	}
	pointsByXC = [];
	for (var i = 0; i < numPoints; i++)
	{
	    pointsByX[4 * i] = points[i][0];
	    pointsByX[4 * i + 1] = points[i][1];
	    if (print_output == undefined)
	    {
		output.innerHTML += "(" + points[i][0] + ", " + points[i][1] + "),";
	    }
	    pointsByX[4 * i + 2] = i;
	    pointsByXC.push([points[i][0],points[i][1], i]);
	}
	// Populate pointsByY
	// sort by y-coordinate
	pointsByXC.sort(function (a,b){return a[1] - b[1];});
	for (var i = 0; i < numPoints; i++)
	{
	    pointsByY[4 * i] = pointsByXC[i][0]; 
	    pointsByY[4 * i + 1] = pointsByXC[i][1];
	    pointsByY[4 * i + 2] = pointsByXC[i][2];
	}


	CL.setup({ debug: true });
	// Setup WebCL context using the default device of the first available platform 
	var ctx = CL.createContext({ device: CL.devices[0], name:'device' + CL.devices[0]});
	// Reserve buffers
	var ckPointsByX = ctx.createBuffer ({ size: 4 * pointsByX.length, name: 'ckPointsByX' });
	var ckPointsByY = ctx.createBuffer ({ size: 4 * pointsByY.length, name: 'ckPointsByY' });
	var ckDiffs     = ctx.createBuffer ({ size: 4 * diffs.length,     name: 'ckDiffs' });
	var ckStrips    = ctx.createBuffer ({ size: 4 * strips.length,    name: 'ckStrips' });

	// Create and build program for the first device
	var kernelSrcDiffs = CL.loadSource('kernels/diffs.cl');
	var kernelDiffs = ctx.buildKernel({ source: kernelSrcDiffs });
	var kernelSrcStrips = CL.loadSource('kernels/strips.cl');
	var kernelStrips = ctx.buildKernel({ source: kernelSrcStrips });

	// Create command queue using the first available device
	var cmdQueue = ctx.createCommandQueue({ name: 'cmdQueue' });
	var start_time = (new Date()).getTime();	
	// Write the buffers to OpenCL device memory
	cmdQueue.enqueueWriteBuffer (ckPointsByX, pointsByX);
	cmdQueue.enqueueWriteBuffer (ckPointsByY, pointsByY);
	cmdQueue.enqueueWriteBuffer (ckDiffs,     diffs);
	cmdQueue.enqueueWriteBuffer (ckStrips,    strips);

	//var kernelDiffs = programDiffs.createKernel ("ckDiffs");
	//var kernelStrips = programStrips.createKernel ("ckStrips");
	// Compute diffs
	kernelDiffs.setArgs(ckPointsByX, ckDiffs, numPoints);
	// +1 to handle the case where numPoints is not even
	var globalWorkSize = [Math.floor((numPoints + 1)/2)];
	var localWorkSize = 1;
	cmdQueue.enqueueKernel(kernelDiffs, globalWorkSize);
	//cmdQueue.enqueueNDRangeKernel(kernelDiffs, globalWorkSize.length, [], globalWorkSize, [], []);
	cmdQueue.finish();
	for (maxStripSize = 4; maxStripSize <= numPoints || (maxStripSize > numPoints && (maxStripSize/2 < numPoints)); maxStripSize *= 2){
	    // Compute strips
	    kernelStrips.setArgs(ckPointsByY, ckPointsByX, ckDiffs, ckStrips, numPoints, maxStripSize);
	    // + maxStripSize - 1 to handle the case where numPoints is not 
	    // a multiple of maxStripSize e.g. maxStripSize = 4 and numPoints = 15
	    var numStrips = (numPoints + maxStripSize - 1)/maxStripSize;
	    globalWorkSize = [numStrips];
	    cmdQueue.enqueueKernel(kernelStrips, globalWorkSize);
	    cmdQueue.finish();
	}
	cmdQueue.enqueueReadBuffer(ckDiffs, diffs);
	cmdQueue.finish();
	var diff = (new Date()).getTime() - start_time;
	if (print_output == undefined)
	{
	    output.innerHTML += "<br/>";
	    output.innerHTML += "OCL Closest Pair: (" + diffs[0] + ", " + diffs[1] + "), (" + diffs[2] + ", " + diffs[3] + ")";
	    output.innerHTML += "<br/>";
	}	   
	// release resources
	if (return_timing_info == undefined)
	{
	    return 0;
	} else
	{
	    return [diff, diffs[0], diffs[1], diffs[2], diffs[3]];
	}
    } catch(e) {
	document.getElementById("output").innerHTML += "<h3>ERROR:</h3><pre style=\"color:red;\">" + e.message + "</pre>";
	throw e;
    }
}
