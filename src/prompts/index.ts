export const prompts = {
  'create-companion': {
    name: 'create-companion',
    description: 'Generate a companion app or service for an existing codebase',
    arguments: [
      {
        name: 'codebase_description',
        description: 'Description of the existing codebase',
        required: true,
      },
      {
        name: 'companion_type',
        description: 'Type of companion (e.g., mobile app, web dashboard, CLI tool)',
        required: true,
      },
    ],
    template: `You are tasked with creating a companion {{companion_type}} for an existing codebase.

Existing Codebase:
{{codebase_description}}

Please design and outline the companion application with the following considerations:

1. **Integration Points**: Identify how the companion will interact with the existing codebase (APIs, shared libraries, data formats)

2. **Architecture**: Propose a suitable architecture that complements the existing system

3. **Key Features**: List the essential features the companion should provide

4. **Technology Stack**: Recommend appropriate technologies that align with the existing codebase

5. **Data Synchronization**: Describe how data will be synchronized between the companion and the main system

6. **Security**: Outline security considerations for the integration

7. **Development Roadmap**: Provide a phased development plan

Please provide a comprehensive design document for the companion application.`,
  },

  'hardening-privacy': {
    name: 'hardening-privacy',
    description: 'Analyze code for privacy issues and suggest hardening measures',
    arguments: [
      {
        name: 'code_snippet',
        description: 'Code snippet or description to analyze',
        required: true,
      },
      {
        name: 'platform',
        description: 'Target platform (e.g., Android, iOS, Web, Backend)',
        required: false,
      },
    ],
    template: `You are a privacy and security expert. Analyze the following code for privacy concerns and suggest hardening measures.

Code to Analyze:
{{code_snippet}}

{{#if platform}}
Platform: {{platform}}
{{/if}}

Please provide:

1. **Privacy Issues Identified**: List all potential privacy concerns in the code
   - Data collection practices
   - Data storage methods
   - Third-party integrations
   - Permission usage
   - Data transmission security

2. **Compliance Concerns**: Identify potential violations of:
   - GDPR (General Data Protection Regulation)
   - CCPA (California Consumer Privacy Act)
   - Platform-specific privacy guidelines

3. **Hardening Recommendations**: Provide specific code changes and best practices:
   - Minimize data collection
   - Implement encryption
   - Add user consent mechanisms
   - Secure data transmission
   - Implement data retention policies
   - Add privacy controls

4. **Code Examples**: Provide concrete code examples demonstrating the recommended changes

5. **Testing Recommendations**: Suggest privacy testing strategies

Please be thorough and prioritize user privacy while maintaining functionality.`,
  },

  'ship-release': {
    name: 'ship-release',
    description: 'Generate a comprehensive release checklist and automation plan',
    arguments: [
      {
        name: 'project_type',
        description: 'Type of project (e.g., mobile app, web app, library, API)',
        required: true,
      },
      {
        name: 'version',
        description: 'Version number for the release',
        required: true,
      },
      {
        name: 'changes',
        description: 'Summary of changes in this release',
        required: false,
      },
    ],
    template: `You are a release engineering expert. Create a comprehensive release plan for shipping version {{version}} of a {{project_type}}.

{{#if changes}}
Changes in this release:
{{changes}}
{{/if}}

Please provide:

1. **Pre-Release Checklist**:
   - Code freeze procedures
   - Testing requirements (unit, integration, E2E, manual)
   - Security audit items
   - Performance benchmarks
   - Documentation updates
   - Dependency updates and security patches

2. **Build & Packaging**:
   - Build configuration verification
   - Asset optimization
   - Code signing and certificates
   - Version numbering scheme
   - Build artifact generation

3. **Release Notes**:
   - Template for user-facing release notes
   - Changelog generation
   - Migration guides (if applicable)
   - Known issues documentation

4. **Deployment Plan**:
   - Staged rollout strategy
   - Rollback procedures
   - Monitoring and alerting setup
   - Feature flags (if applicable)
   - Database migrations

5. **Post-Release**:
   - Monitoring checklist
   - User feedback collection
   - Hotfix procedures
   - Version tagging in Git
   - Communication plan (users, stakeholders)

6. **Automation Opportunities**:
   - CI/CD pipeline improvements
   - Automated testing
   - Release automation scripts
   - Notification systems

7. **Platform-Specific Considerations**:
   {{#if project_type}}
   - Specific requirements for {{project_type}}
   {{/if}}
   - App store submission (if applicable)
   - CDN deployment (if applicable)
   - API versioning (if applicable)

Please provide a detailed, actionable release plan.`,
  },
};

export type PromptName = keyof typeof prompts;

