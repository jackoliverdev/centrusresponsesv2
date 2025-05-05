# API Updates

## Overview
This document outlines the changes needed to integrate OpenAI's new Responses API into the existing codebase.

## Key Changes for Responses API Integration

### 1. New API Client Methods
- Core Response creation methods
- Stream response functionality
- Response management utilities

### 2. Type Definitions
- Import response-related types from OpenAI SDK
- Define custom types for application-specific functionality
- Extend existing types to accommodate new response formats

### 3. Built-in Tools Implementation
- Web Search Integration
  - Enable querying the web for real-time information
  - Configure search parameters and behavior
  
- File Search Integration
  - Allow searching across uploaded files
  - Configure file retrieval parameters
  - Integrate with existing file management

### 4. Persistent Conversations
- Conversation creation and management
- Conversation retrieval and access
- Adding new messages to existing conversations
- Managing conversation history and context

### 5. Enhanced Streaming
- Streaming with built-in tools
- Managing chunked response processing
- Real-time response handling

## Files to be Modified

### 1. Assistant Service
- `packages/backend/src/assistant/assistant.service.ts`
  - Replace assistant creation with responses API
  - Update file management to support new response formats
  - Add conversation state management
  - Modify database interactions for persistent storage

### 2. Thread Service
- `packages/backend/src/thread/thread.service.ts`
  - Replace thread creation with conversation API
  - Update message handling for new message formats
  - Implement streaming with built-in tools
  - Update folder management to work with new conversation structure

### 3. Database Schema
- Replace assistants table with responses configuration
- Update thread tables to conversation structure
- Modify file reference tables
- Add tables for web search caching and history

### 4. API Controllers
- Update endpoints to use new response formats
- Add endpoints for web search capabilities
- Modify streaming endpoints for enhanced functionality
- Update file integration endpoints

## Key Changes by Component

### 1. OpenAI Service
- Replace Assistants API calls with Responses API
- Implement conversation management
- Add web and file search capabilities
- Update error handling for new response formats
- Implement caching for improved performance

### 2. Assistant Management
- Replace assistant objects with response configurations
- Update model selection to support new models
- Implement conversation-based instruction handling
- Update file integration for new search capabilities

### 3. Thread Management
- Replace thread creation with conversation management
- Implement history and context preservation
- Add support for built-in tool responses
- Update user interface for enhanced conversation features

## Migration Strategy

### 1. Preparation Phase
- Document existing functionality
- Map current features to new API capabilities
- Create test environments for API exploration

### 2. Implementation Phase
- Develop core response methods
- Implement conversation management
- Add file and web search integration
- Update database schema

### 3. Testing Phase
- Validate response quality and format
- Test conversation persistence
- Verify tool functionality
- Performance testing

### 4. Deployment Phase
- Staged rollout to production
- Monitoring and logging
- User feedback collection