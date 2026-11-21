// Entry point for hosting panels that require a CommonJS startup file.
// Keep Node.js 24+ and a single application worker; confirm Passenger support with the host.
import('./server.js').catch(error=>{
  console.error('myKampung gagal dimulakan:',error.message);
  process.exitCode=1;
});
