#!/bin/bash
# AWS EC2 Amazon Linux 2023 User Data Launch Script

# Update system
dnf update -y

# Install Git and Docker
dnf install -y git docker

# Start Docker service
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group so sudo isn't needed
usermod -aG docker ec2-user

# Install Docker Compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Install Docker Buildx plugin (required for builds)
<<<<<<< HEAD
curl -SL https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-buildx
=======
curl -SL https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-amd64 -o /usr/local/lib/docker/cli-plugins/docker-buildx
>>>>>>> 46509a8 (AWS deployment setup scripts)
chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx

echo "Docker and plugins installation complete."
