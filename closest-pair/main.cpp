#include <stdlib.h>
#include <stdio.h>
#include <CL/cl.h>
#include <cassert>
#include <iostream>
#include <string.h>
#include <math.h> 
#include <limits.h>
#include <sys/time.h>
#define SUCCESS 0
#define FAIL    -1
using namespace std;
#define HANDLEERROR                                                      \
                                                                         \
    if (error < 0)                                                       \
    {                                                                    \
	cerr << "error: " << error << " line " << __LINE__ <<  endl;	 \
	cl_long4 e;                                                       \
        e.s[0] = INT_MIN; e.s[1] = INT_MIN; e.s[2] = INT_MIN; e.s[3] = INT_MIN;\
	return e;                                                        \
    }                                                                    \

cl_program createPrograms(cl_context context, cl_int *err)
{
    if (err == NULL) {
	cerr << "passed null for err" << endl;
	return (cl_program)NULL;
    }
    FILE* file = fopen("kernel.cl", "r");
    fseek(file, 0, SEEK_END);
    size_t programSize = ftell(file);
    rewind(file);
    
    char* programBuffer = (char*)malloc(programSize + 1);
    programBuffer[programSize] = '\0';
    fread(programBuffer, sizeof(char), programSize, file);
    fclose(file);
    cl_program program = clCreateProgramWithSource(context, 1, (const char**)&programBuffer, &programSize, err);
    return program;
}

cl_int buildProgram(cl_context context, cl_device_id device, cl_program program){
    const char options[] = "-cl-std=CL1.1 -cl-mad-enable -Werror";
    return clBuildProgram(program, 1, &device, options, NULL, NULL);
}

cl_kernel* createKernels(cl_context context, cl_device_id device, cl_program program, cl_uint *num_kernels, cl_int *error){
    cl_kernel *kernels;
    *error = clCreateKernelsInProgram(program, 0, NULL, num_kernels);
    if (error < 0){
	perror("Couldn't find any kernels");
	exit(1);
    }
    
    kernels = (cl_kernel*)malloc(*num_kernels * sizeof(cl_kernel));
    
    clCreateKernelsInProgram(program, *num_kernels, kernels, NULL);
    return kernels;
}

cl_platform_id *platform;
cl_context context;
cl_command_queue queue;
cl_device_id device;
cl_program program;
cl_kernel diffsKernel, stripsKernel;
cl_kernel* kernels;
cl_uint numKernels;

void cleanup()
{
    for (auto i = 0; i < numKernels; i++) {
	clReleaseKernel(kernels[i]);    
    }
    clReleaseCommandQueue(queue);
    clReleaseProgram(program);
    clReleaseContext(context);
}

int initOCL(){
    const size_t size = 12345678;
    const size_t mem_size = sizeof(float)*size;
    
    cl_int error = CL_SUCCESS;
    cl_uint numPlatforms;
    // Initializing the basic OpenCL environment
    error = clGetPlatformIDs(5, NULL, &numPlatforms);	    
    if (error){
	cerr << "the following error occured: " << error << endl;
	return error;
    }
    
    platform = (cl_platform_id*)malloc(numPlatforms * sizeof(cl_platform_id));    	
    error = clGetPlatformIDs(numPlatforms, platform, NULL);	
    if (error){
	cerr << "the following error occured: " << error << endl;
	return error;
    }
    
    printf("numPlatforms %i\n", numPlatforms);
    char platformName[40];
    char platformVendor[40];
    int intelCPUPlatformID = -1;
    for (int i = 0; i < numPlatforms; i++) {
	int s = sizeof(platformName);
	clGetPlatformInfo(platform[i], CL_PLATFORM_NAME, sizeof(platformName), &platformName, NULL);
	printf("platform_name: %s\n", platformName);
	clGetPlatformInfo(platform[i], CL_PLATFORM_VENDOR, sizeof(platformVendor), &platformVendor, NULL);
	printf("platform_vendor: %s\n", platformVendor);
    }
    error = clGetDeviceIDs(*platform, CL_DEVICE_TYPE_CPU, 1, &device, NULL);
    if (error) {
	cerr << "the following error occured: " << error << endl;
	return error;
    }
    assert(error == CL_SUCCESS);
    context = clCreateContext(NULL, 1, &device, NULL, NULL, &error);
    if (error){
	cerr << "the following error occured: " << error << endl;
	return error;
    }
    queue = clCreateCommandQueue(context, device, 0, &error);
    if (error) {
	cerr << "the following error occured: " << error << endl;
	return error;
    }
    char ext_data[4096];
    clGetDeviceInfo(device, CL_DEVICE_EXTENSIONS, sizeof(ext_data), ext_data, NULL);
    printf("extensions: %s\n", ext_data);

    program = createPrograms(context, &error);
    if (error != CL_SUCCESS) {
	return error;
    }
    error = buildProgram(context, device, program);
    if (error) {
	size_t log_size;
	clGetProgramBuildInfo(program, device, CL_PROGRAM_BUILD_LOG,
			      0, NULL, &log_size);
	char *program_log = (char*) calloc(log_size+1, sizeof(char));
	clGetProgramBuildInfo(program, device, CL_PROGRAM_BUILD_LOG,
			      log_size+1, program_log, NULL);
	printf("%s\n", program_log);
	free(program_log);
    }
    if (error != CL_SUCCESS)                                             
    {                                                                    
	cerr << "error: " << error << " line " << __LINE__ <<  endl;	 
	return error;                                                        
    }                                                                    

    kernels = createKernels(context, device, program, &numKernels, &error);
    diffsKernel = NULL;
    stripsKernel = NULL;
    char kernelName[20];
    for (auto i = 0; i < numKernels; i++) {
	
	error = clGetKernelInfo(kernels[i], CL_KERNEL_FUNCTION_NAME, sizeof(kernelName), kernelName, NULL);
	if (error != CL_SUCCESS)                                             
	{                                                                    
	    cerr << "error: " << error << " line " << __LINE__ <<  endl;	 
	    return error;                                                        
	}                                                                    
	if (strcmp(kernelName, "ckDiffs") == 0) {
	    diffsKernel = kernels[i];
	}
	if (strcmp(kernelName, "ckStrips") == 0) {
	    stripsKernel = kernels[i];
	}

    }
    if (diffsKernel == NULL) {
	cerr << "diffsKernel == null" << endl; 	
	return CL_BUILD_PROGRAM_FAILURE;
    }

    return 0;
}

int compare(const void *a, const void *b)
{
    return *(cl_long*)(a) - *(cl_long*)(b);
}

int compare_y(const void *a, const void *b)
{
    return *((cl_long*)a+1) - *((cl_long*)b+1);
}

cl_long4 closestPairBruteForce(const cl_long2* points, const int numPoints)
{
    if (numPoints <= 1)
    {
	return (cl_long4){0, 0, 0, 0};
    }
    cl_long4 pair;
    pair.s[0] = points[0].s[0];
    pair.s[1] = points[0].s[1];
    pair.s[2] = points[1].s[0];
    pair.s[3] = points[1].s[1];
    cl_float d = sqrt((points[0].s[0] - points[1].s[0]) * (points[0].s[0] - points[1].s[0]) +
	(points[0].s[1] - points[1].s[1]) * (points[0].s[1] - points[1].s[1]));
    int closesti = 0;
    int closestj = 1;
    for (uint i = 0; i < numPoints; i++) 
    {
	for (uint j = 0; j < numPoints; j++)
	{
	    if (j == i) continue;
	    cl_float dx = points[i].s[0] - points[j].s[0];
	    cl_float dy = points[i].s[1] - points[j].s[1];
	    if (sqrt(dx * dx + dy * dy) < d)
	    {
		cl_float oldD = d;
		d = sqrt(dx * dx + dy * dy);
		pair.s[0] = points[i].s[0];
		pair.s[1] = points[i].s[1];
		pair.s[2] = points[j].s[0];
		pair.s[3] = points[j].s[1];	       
		closesti = i;
		closestj = j;
	    }
	}
    }
    return pair;
}

cl_float distance(cl_long4 pair)
{
    cl_long dx = pair.s[0] - pair.s[2];
    cl_long dy = pair.s[1] - pair.s[3];
    return sqrt(dx * dx + dy * dy);
}

cl_float distance(cl_long2 p1, cl_long2 p2)
{
    cl_float dx = p2.s[0] - p1.s[0];
    cl_float dy = p2.s[1] - p1.s[1];
    return sqrt(dx * dx + dy * dy);
}

cl_long4 closestPairOCL(const cl_long2* points, const cl_uint numPoints) 
{
    if (numPoints <= 1)
    {
	return (cl_long4){0, 0, 0, 0};
    }

    cl_long3 pointsByX[numPoints];
    cl_long3 pointsByY[numPoints];

    // +1 to handle the case where numPoints is not even
    cl_long4 diffs[(numPoints + 1)/2];
    // multiple by 2 for case where numPoints is non-power of 2.
    cl_long2 strips[numPoints * 2];
    for (auto i = 0; i < numPoints; i++) 
    {
	pointsByX[i].s[0] = points[i].s[0];
	pointsByX[i].s[1] = points[i].s[1];
    }
    qsort(pointsByX, numPoints, sizeof(cl_long3), compare);
    for (auto i = 0; i < numPoints; i++) 
    {
	pointsByX[i].s[2] = i;
    }
    memcpy(pointsByY, pointsByX, sizeof(pointsByX));
    qsort(pointsByY, numPoints, sizeof(cl_long3), compare_y);
    cl_int error;

    // Setup buffers
    cl_mem ckPointsByX = clCreateBuffer(context, CL_MEM_COPY_HOST_PTR, sizeof(pointsByX), &pointsByX, &error);
    HANDLEERROR;
    cl_mem ckPointsByY = clCreateBuffer(context, CL_MEM_COPY_HOST_PTR, sizeof(pointsByY), &pointsByY, &error);
    HANDLEERROR;
    cl_mem ckDiffs = clCreateBuffer(context, CL_MEM_READ_WRITE, sizeof(diffs), NULL, &error);
    HANDLEERROR;
    cl_mem ckStrips = clCreateBuffer(context, CL_MEM_READ_WRITE, sizeof(strips), NULL, &error);
    HANDLEERROR;

    // Compute diffs
    error = clSetKernelArg(diffsKernel, 0, sizeof(ckPointsByX), &ckPointsByX);
    HANDLEERROR;
    error = clSetKernelArg(diffsKernel, 1, sizeof(ckDiffs), &ckDiffs);
    HANDLEERROR;
    error = clSetKernelArg(diffsKernel, 2, sizeof(cl_uint), &numPoints);
    HANDLEERROR;
    // +1 to handle the case where numPoints is not even
    size_t globalWorkSize = (numPoints + 1)/2;
    size_t localWorkSize = 1;
    error = clEnqueueNDRangeKernel(queue, diffsKernel, 1, NULL, &globalWorkSize, NULL, 0, NULL, NULL);
    HANDLEERROR;
    clFinish(queue);
    for (uint maxStripSize = 4; maxStripSize <= numPoints || (maxStripSize > numPoints && (maxStripSize/2 < numPoints)); maxStripSize *= 2){
	// Compute strips
	error = clSetKernelArg(stripsKernel, 0, sizeof(ckPointsByY), &ckPointsByY);
	HANDLEERROR;
	error = clSetKernelArg(stripsKernel, 1, sizeof(ckPointsByX), &ckPointsByX);
	HANDLEERROR;
	error = clSetKernelArg(stripsKernel, 2, sizeof(ckDiffs), &ckDiffs);
	HANDLEERROR;
	error = clSetKernelArg(stripsKernel, 3, sizeof(ckStrips), &ckStrips);
	HANDLEERROR;
	error = clSetKernelArg(stripsKernel, 4, sizeof(cl_uint), &numPoints);
	HANDLEERROR;
	error = clSetKernelArg(stripsKernel, 5, sizeof(cl_uint), &maxStripSize);
	HANDLEERROR;
	// + maxStripSize - 1 to handle the case where numPoints is not 
	// a multiple of maxStripSize e.g. maxStripSize = 4 and numPoints = 15
	auto numStrips = (numPoints + maxStripSize - 1)/maxStripSize;
	globalWorkSize = numStrips;
	localWorkSize = 1;
	error = clEnqueueNDRangeKernel(queue, stripsKernel, 1, NULL, &globalWorkSize, &localWorkSize, 0, NULL, NULL);
	HANDLEERROR;
	clFinish(queue);
    }
    clEnqueueReadBuffer(queue, ckDiffs, CL_TRUE, 0, sizeof(diffs), &diffs, 0, NULL, NULL);

    // release resources
    clReleaseMemObject(ckPointsByX);
    clReleaseMemObject(ckPointsByY);
    clReleaseMemObject(ckDiffs);
    clReleaseMemObject(ckStrips);
    return diffs[0];
}

uint test();

cl_long2* generatePoints(const int numPoints, const cl_ulong2 range, const int seed, const int minDist)
{
    cl_long2 *points = (cl_long2*)malloc(sizeof(cl_long2) * numPoints);
    if (!points)
    {
	return NULL;
    }
    srand(seed);
    for (uint i = 0; i < numPoints; i++)
    {
	bool dup = true;
	while (dup)
	{
	    dup = false;
	    long x = rand() % range.s[0];
	    long y = rand() % range.s[1];
	    points[i].s[0] = x;
	    points[i].s[1] = y;
	    for (uint j = 0; j < i; j++){
		if ((points[j].s[0] == x && points[j].s[1] == y) || distance(points[j], (cl_long2){x, y}) < minDist)
		{
		    dup = true;
		    break;
		}
	    
	    }
	}
    }
    return points;
}

int main() {
    if (initOCL()) {
	cerr << "Error initializing OCL" << endl;
	return -1;
    }

    if (test() == SUCCESS)
    {
	printf("SUCCESS!\n");
    }
    else
    {
	printf("FAILURE :-(\n");
    }

    cleanup();

    return SUCCESS;
}

#define NUMITERATIONS 10

uint test()
{
    for(int numPoints = 0; numPoints <= 512; numPoints++)//512; numPoints++)
    {
	for(int testId = 0; testId < NUMITERATIONS; testId++)
	{
	    cl_ulong2 range;

	    range.s[0] = 256 * numPoints;
	    range.s[1] = 256 * numPoints;
	    cl_long2* points = generatePoints(numPoints, range, testId + 2, rand() % 10);
	    if (!points) 
	    {
		return FAIL;
	    }

	    timeval start, stop, resultOCL, resultBF;
	    gettimeofday(&start, NULL);
	    cl_long4 closestOCL = closestPairOCL(points, numPoints);
	    gettimeofday(&stop, NULL);
	    resultOCL.tv_sec = stop.tv_sec - start.tv_sec;
	    resultOCL.tv_usec = stop.tv_usec - start.tv_usec;
	    gettimeofday(&start, NULL);	    
	    cl_long4 closestBF = closestPairBruteForce(points, numPoints);
	    gettimeofday(&stop, NULL);
	    resultBF.tv_sec = stop.tv_sec - start.tv_sec;
	    resultBF.tv_usec = stop.tv_usec - start.tv_usec;
	    cl_float dOCL = distance(closestOCL);
	    cl_float dBF = distance(closestBF);
	    if (testId == 0 && numPoints % 64 == 0)
	    {
		cout << "NumPoints = " << numPoints << ", OCL = " << dOCL << ", BF = " << dBF << endl;
		cout << "Time OCL = " << resultOCL.tv_sec + resultOCL.tv_usec/1000000.0 
		     << ", Time BF = " << resultBF.tv_sec + resultBF.tv_usec/1000000.0 << endl;
	    }
	    if (dOCL != dBF)
	    {
		cout << "d(OCL) != d(BF)!!" << ", d(OCL) = " << dOCL << ", d(BF) = " << dBF << endl;
		cout << "closestOCL: (" << closestOCL.s[0] << ", " << closestOCL.s[1] << "), (" <<
		    closestOCL.s[2] << ", " << closestOCL.s[3] << ")" << endl;

		cout << "closestBF: (" << closestBF.s[0] << ", " << closestBF.s[1] << "), (" <<
		    closestBF.s[2] << ", " << closestBF.s[3] << ")" << endl;
		cout << "numPoints: " << numPoints << endl;
		for (int i = 0; i < numPoints; i++)
		{
		    cout << "points[i]: " << points[i].s[0] << ", " << points[i].s[1] << endl;
		}
		return FAIL;
	    } 
	    free(points);
	}
    }
    return SUCCESS;
}
