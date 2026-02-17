# Docker File Browser

A web-based file browser for downloading files from Docker containers.

## Features

- 🐳 Browse files from any running Docker container
- 📥 Download files directly from containers
- 📁 Navigate directory structure
- 🎨 Clean, responsive web interface
- ⚡ Real-time container listing
- 🔍 Quick access to common directories

## Quick Start

### Option 1: Using Docker Compose

```bash
cd docker-file-browser

# Build and run
docker-compose up -d

# Access at http://localhost:3000
```

### Option 2: Local Node.js

```bash
npm install
PORT=3000 npm start

# Access at http://localhost:3000
```

## Usage

1. **Select Container**: Choose a running container from the dropdown
2. **Navigate**: Enter a path or click quick shortcuts in the sidebar
3. **Browse**: View files in the directory
4. **Download**: Click "Download" button to download any file

## Configuration

### Environment Variables

- `PORT` - Web server port (default: 3000)
- `CONTAINER_NAME` - Default container to browse (optional)

### Docker Socket

The app requires access to the Docker socket to list containers and execute commands inside them.

In Docker Compose, this is handled automatically via:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

When running locally, ensure `/var/run/docker.sock` is accessible.

## API Endpoints

- `GET /api/containers` - List running containers
- `GET /api/files?container=ID&dir=/path` - List files in directory
- `GET /api/dirs?container=ID&dir=/path` - List subdirectories
- `GET /api/download?container=ID&path=/path/file` - Download file
- `GET /api/filestat?container=ID&path=/path/file` - Get file metadata

## Customization

### Add More Quick Paths

Edit `public/index.html` and add links in the Quick Paths section:

```html
<li><a href="#" onclick="navigate('/custom/path'); return false;">
  📁 Custom Path
</a></li>
```

### Target Specific Container

Set `CONTAINER_NAME` environment variable:

```bash
CONTAINER_NAME=my-app PORT=3000 npm start
```

Or in docker-compose.yml:

```yaml
environment:
  - CONTAINER_NAME=my-app
```

## Example Workflows

### Browse a Web App Container

```bash
docker run -d --name myapp nginx
# Then select "myapp" in the browser and navigate to /usr/share/nginx/html
```

### Download Logs

```bash
# Set path to /var/log
# Download any .log files
```

### Access Database Files

```bash
# Target a database container
# Navigate to its data directory (/var/lib/postgresql, /data, etc.)
```

## Troubleshooting

### "No running containers found"
- Ensure containers are actually running: `docker ps`
- Check Docker socket permissions

### File not found error
- Verify the path exists in the container
- Use absolute paths starting with `/`
- Some containers may have restricted file systems

### Permission denied
- The app runs with container user privileges
- Files must be readable by that user

## Security Notes

- This tool requires Docker socket access (equivalent to `root` privileges)
- Only expose to trusted networks
- Consider adding authentication for production use

## License

MIT
