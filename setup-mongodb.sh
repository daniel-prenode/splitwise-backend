#!/bin/bash

# MongoDB Setup Script for Splitwise Backend
# This script helps set up MongoDB for local development

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🍃 MongoDB Setup for Splitwise Backend${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if MongoDB is running
check_mongodb_running() {
    if pgrep -x "mongod" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Check if MongoDB is installed
if ! command_exists mongod; then
    echo -e "${RED}❌ MongoDB is not installed${NC}"
    echo -e "${YELLOW}Please install MongoDB using one of these methods:${NC}"
    echo ""
    echo -e "${BLUE}🍺 Using Homebrew (macOS):${NC}"
    echo "  brew tap mongodb/brew"
    echo "  brew install mongodb-community"
    echo ""
    echo -e "${BLUE}🐳 Using Docker:${NC}"
    echo "  docker run -d -p 27017:27017 --name splitwise-mongo mongo:latest"
    echo ""
    echo -e "${BLUE}📦 Using official installer:${NC}"
    echo "  Visit: https://www.mongodb.com/try/download/community"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ MongoDB is installed${NC}"

# Check if MongoDB is running
if check_mongodb_running; then
    echo -e "${GREEN}✅ MongoDB is already running${NC}"
else
    echo -e "${YELLOW}🔄 MongoDB is not running. Starting MongoDB...${NC}"
    
    # Try to start MongoDB (macOS with Homebrew)
    if command_exists brew; then
        brew services start mongodb/brew/mongodb-community
        sleep 3
        
        if check_mongodb_running; then
            echo -e "${GREEN}✅ MongoDB started successfully${NC}"
        else
            echo -e "${RED}❌ Failed to start MongoDB with Homebrew${NC}"
            echo -e "${YELLOW}Try starting MongoDB manually:${NC}"
            echo "  mongod --config /usr/local/etc/mongod.conf"
            exit 1
        fi
    else
        echo -e "${YELLOW}Please start MongoDB manually:${NC}"
        echo "  mongod"
        echo ""
        echo "Or if using systemctl:"
        echo "  sudo systemctl start mongod"
        exit 1
    fi
fi

# Test connection to MongoDB
echo -e "${YELLOW}🔍 Testing MongoDB connection...${NC}"
if mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Successfully connected to MongoDB${NC}"
else
    echo -e "${RED}❌ Failed to connect to MongoDB${NC}"
    echo -e "${YELLOW}Please check if MongoDB is running on the default port (27017)${NC}"
    exit 1
fi

# Create databases
echo -e "${YELLOW}🗄️  Setting up databases...${NC}"

# Create development database
mongosh --eval "
use('splitwise-dev');
db.createCollection('users');
print('✅ Created development database: splitwise-dev');
"

# Create test database
mongosh --eval "
use('splitwise-test');
db.createCollection('users');
print('✅ Created test database: splitwise-test');
"

# Create indexes for better performance
echo -e "${YELLOW}📊 Creating database indexes...${NC}"
mongosh splitwise-dev --eval "
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });
print('✅ Created indexes on users collection');
"

echo ""
echo -e "${GREEN}🎉 MongoDB setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Database Information:${NC}"
echo "  Development DB: splitwise-dev"
echo "  Test DB: splitwise-test"
echo "  Connection: mongodb://localhost:27017"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "  1. Copy .env.example to .env"
echo "  2. Update .env with your configuration"
echo "  3. Run: npm run dev"
echo ""
echo -e "${YELLOW}💡 Useful MongoDB Commands:${NC}"
echo "  Connect to DB: mongosh splitwise-dev"
echo "  Stop MongoDB: brew services stop mongodb/brew/mongodb-community"
echo "  Start MongoDB: brew services start mongodb/brew/mongodb-community"
