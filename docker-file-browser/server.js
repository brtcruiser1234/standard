const express = require('express');
const Docker = require('dockerode');
const path = require('path');
const stream = require('stream');

const app = express();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const PORT = process.env.PORT || 3000;
const CONTAINER_NAME = process.env.CONTAINER_NAME || 'my-container';

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Get list of running containers
app.get('/api/containers', async (req, res) => {
  try {
    const containers = await docker.listContainers();
    const list = containers.map(c => ({
      id: c.Id.substring(0, 12),
      name: c.Names[0]?.replace('/', '') || 'unknown',
      image: c.Image,
      status: c.Status,
      state: c.State
    }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List files in container directory
app.get('/api/files', async (req, res) => {
  try {
    const containerName = req.query.container || CONTAINER_NAME;
    const dir = req.query.dir || '/';

    const container = docker.getContainer(containerName);

    // Execute ls command in container
    const exec = await container.exec({
      Cmd: ['find', dir, '-maxdepth', '1', '-type', 'f', '-exec', 'ls', '-lhS', '{}', '+'],
      AttachStdout: true,
      AttachStderr: true
    });

    let output = '';
    const stream = await exec.start({ Detach: false });

    stream.on('data', chunk => {
      output += chunk.toString();
    });

    stream.on('end', () => {
      const files = parseLS(output);
      res.json({ files, path: dir });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List directories in container path
app.get('/api/dirs', async (req, res) => {
  try {
    const containerName = req.query.container || CONTAINER_NAME;
    const dir = req.query.dir || '/';

    const container = docker.getContainer(containerName);

    const exec = await container.exec({
      Cmd: ['find', dir, '-maxdepth', '1', '-type', 'd'],
      AttachStdout: true,
      AttachStderr: true
    });

    let output = '';
    const stream = await exec.start({ Detach: false });

    stream.on('data', chunk => {
      output += chunk.toString();
    });

    stream.on('end', () => {
      const dirs = output
        .split('\n')
        .filter(line => line.trim() && line !== dir)
        .map(p => ({
          name: p.split('/').pop(),
          path: p
        }));
      res.json(dirs);
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download file from container
app.get('/api/download', async (req, res) => {
  try {
    const containerName = req.query.container || CONTAINER_NAME;
    const filePath = req.query.path;

    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    const container = docker.getContainer(containerName);
    const fileStream = await container.getArchive({ path: filePath });

    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    fileStream.stream.pipe(res);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get file stats
app.get('/api/filestat', async (req, res) => {
  try {
    const containerName = req.query.container || CONTAINER_NAME;
    const filePath = req.query.path;

    const container = docker.getContainer(containerName);
    const stat = await container.getArchive({ path: filePath });

    res.json({
      name: path.basename(filePath),
      size: stat.stat.size,
      mtime: stat.stat.mtime,
      mode: stat.stat.mode
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to parse ls output
function parseLS(output) {
  return output
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const parts = line.split(/\s+/);
      return {
        name: parts[parts.length - 1],
        size: parts[4],
        modified: `${parts[5]} ${parts[6]} ${parts[7]}`,
        permissions: parts[0],
        fullLine: line
      };
    });
}

app.listen(PORT, () => {
  console.log(`Docker File Browser running on port ${PORT}`);
  console.log(`Container target: ${CONTAINER_NAME}`);
  console.log(`Access at: http://localhost:${PORT}`);
});
