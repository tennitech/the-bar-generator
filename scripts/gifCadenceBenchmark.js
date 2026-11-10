/* Actual renderer/codec comparison: 30/40 ms (~30 fps) versus 20 ms (~50 fps).
 * Shares raster adapters, decoding checks and metrics with the historical benchmark.
 * RPI_GIF_BENCHMARK_FILTER=ticker:large:bar selects one pair.
 * RPI_GIF_ALPHA_MODE=threshold evaluates PR #144 with identical alpha in both cases.
 * Optional native canvas is test-only; no browser or app dependency is introduced.
 */
process.env.RPI_GIF_BENCHMARK_MODE = 'cadence';
if (!process.argv[2]) process.argv[2] = '/tmp/rpi-gif-cadence';
require('./gifFrameRateBenchmark');
