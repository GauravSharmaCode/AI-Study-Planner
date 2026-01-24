# AI Study Planner - Product Overview

## Purpose & Value Proposition
AI Study Planner is an intelligent microservices application that generates personalized study schedules using Google Gemini AI. It transforms study goals into actionable, time-optimized plans while tracking progress through structured sessions.

## Key Features & Capabilities

### AI-Powered Study Planning
- **Intelligent Schedule Generation**: Uses Google Gemini AI to create personalized study plans based on subjects, available hours, and target completion dates
- **Dynamic Session Management**: Automatically breaks down study plans into manageable daily sessions
- **Progress Tracking**: Real-time monitoring of study session completion and remarks

### User Management & Authentication
- **Secure Authentication**: JWT-based authentication system with bcrypt password hashing
- **User Profiles**: Comprehensive user management with profile data and preferences
- **Session Management**: Redis-backed session handling for scalable user state

### Microservices Architecture
- **Service Isolation**: Independent user and AI schedule services with separate databases
- **API Gateway**: NGINX-based gateway for unified API access and load balancing
- **Container-First**: Full Docker containerization for consistent deployment

### Data Management
- **Multi-Database**: Separate PostgreSQL databases for user and schedule data
- **Schema-First Design**: Zod-based validation ensuring runtime safety and type consistency
- **Caching Layer**: Redis integration for performance optimization

## Target Users & Use Cases

### Primary Users
- **Students**: Individuals seeking structured study schedules for academic success
- **Self-Learners**: People pursuing personal education goals with time constraints
- **Educators**: Teachers and tutors managing multiple student study plans

### Core Use Cases
1. **Study Plan Creation**: Generate AI-optimized schedules based on learning objectives
2. **Progress Monitoring**: Track completion rates and add session-specific notes
3. **Schedule Adaptation**: Modify plans based on progress and changing requirements
4. **Multi-Subject Management**: Handle complex study schedules across multiple topics

### Business Value
- **Time Optimization**: AI-driven scheduling maximizes learning efficiency
- **Consistency**: Structured approach improves study habit formation
- **Scalability**: Microservices architecture supports growing user bases
- **Flexibility**: Modular design allows feature expansion and customization