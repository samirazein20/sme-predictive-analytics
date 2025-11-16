// Main infrastructure deployment for SME Analytics Platform
targetScope = 'resourceGroup'

@minLength(1)
@maxLength(64)
@description('Name of the environment (used for resource naming)')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string = resourceGroup().location

// Resource token for unique naming
var resourceToken = uniqueString(subscription().id, resourceGroup().id, location, environmentName)

// SME Analytics resource name prefixes
var keyVaultPrefix = 'kv-sme-analytics'
var containerRegistryPrefix = 'acrsmeanalytics'
var logAnalyticsPrefix = 'log-sme-analytics'
var containerAppEnvPrefix = 'cae-sme-analytics'
var postgresPrefix = 'psql-sme-analytics'
var redisPrefix = 'redis-sme-analytics'
var managedIdentityPrefix = 'id-sme-analytics'

// Resource names (with meaningful prefixes)
var keyVaultName = take('${keyVaultPrefix}-${resourceToken}', 24)
var containerRegistryName = take('${containerRegistryPrefix}${resourceToken}', 50)
var logAnalyticsName = take('${logAnalyticsPrefix}-${resourceToken}', 63)
var containerAppEnvName = take('${containerAppEnvPrefix}-${resourceToken}', 60)
var postgresServerName = take('${postgresPrefix}-${resourceToken}', 63)
var redisName = take('${redisPrefix}-${resourceToken}', 63)
var managedIdentityName = take('${managedIdentityPrefix}-${resourceToken}', 128)

// Database configuration
@secure()
@description('PostgreSQL administrator password')
param postgresAdminPassword string

@description('PostgreSQL administrator username')
param postgresAdminUser string = 'smeadmin'

@description('PostgreSQL database name')
param postgresDatabaseName string = 'sme_analytics'

// ====== User-Assigned Managed Identity (REQUIRED FIRST) ======
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
}

// ====== Log Analytics Workspace ======
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ====== Application Insights ======
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-sme-analytics-${resourceToken}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ====== Azure Container Registry ======
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false // Disable anonymous pull access (security best practice)
    publicNetworkAccess: 'Enabled'
  }
}

// ====== ACR Pull Role Assignment (MANDATORY BEFORE CONTAINER APPS) ======
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, managedIdentity.id, 'acrPull')
  scope: containerRegistry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull role
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// ====== Azure Database for PostgreSQL Flexible Server ======
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: postgresServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: postgresAdminUser
    administratorLoginPassword: postgresAdminPassword
    version: '14'
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// PostgreSQL Firewall Rule (Allow Azure Services)
resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureServicesAndResourcesWithinAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// PostgreSQL Database
resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: postgresDatabaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// ====== Azure Cache for Redis ======
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisName
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
  }
}

// ====== Key Vault (for secrets) ======
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true // DO NOT disable purge protection (security requirement)
  }
}

// Key Vault Secrets Officer role for managed identity
resource keyVaultSecretsOfficerRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, managedIdentity.id, 'secretsOfficer')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7') // Key Vault Secrets Officer
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Store PostgreSQL connection string in Key Vault
resource postgresConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'postgres-connection-string'
  properties: {
    value: 'jdbc:postgresql://${postgresServer.properties.fullyQualifiedDomainName}:5432/${postgresDatabaseName}?user=${postgresAdminUser}&password=${postgresAdminPassword}&sslmode=require'
  }
}

// Store Redis connection string in Key Vault
resource redisConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'redis-connection-string'
  properties: {
    value: '${redisCache.properties.hostName}:${redisCache.properties.sslPort},password=${redisCache.listKeys().primaryKey},ssl=True,abortConnect=False'
  }
}

// ====== Container Apps Environment (for Backend and ML Services) ======
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ====== Backend Container App (Spring Boot API) ======
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'sme-analytics-api'
  location: location
  tags: {
    'azd-service-name': 'backend'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: true
        }
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: managedIdentity.id
        }
      ]
      secrets: [
        {
          name: 'postgres-connection-string'
          value: 'postgresql://${postgresAdminUser}:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${postgresDatabaseName}?sslmode=require'
        }
        {
          name: 'redis-password'
          value: redisCache.listKeys().primaryKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'sme-analytics-api'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' // Base image (will be updated during deployment)
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            {
              name: 'SPRING_PROFILES_ACTIVE'
              value: 'production'
            }
            {
              name: 'SPRING_DATASOURCE_URL'
              secretRef: 'postgres-connection-string'
            }
            {
              name: 'SPRING_REDIS_HOST'
              value: redisCache.properties.hostName
            }
            {
              name: 'SPRING_REDIS_PORT'
              value: string(redisCache.properties.sslPort)
            }
            {
              name: 'SPRING_REDIS_PASSWORD'
              secretRef: 'redis-password'
            }
            {
              name: 'SPRING_REDIS_SSL'
              value: 'true'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsights.properties.ConnectionString
            }
            {
              name: 'SERVER_PORT'
              value: '8080'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
  dependsOn: [
    acrPullRole
  ]
}

// ====== ML Services Container App (FastAPI) ======
resource mlServicesApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'sme-predictive-engine'
  location: location
  tags: {
    'azd-service-name': 'ml-services'
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8001
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: true
        }
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: managedIdentity.id
        }
      ]
      secrets: [
        {
          name: 'appinsights-key'
          value: appInsights.properties.InstrumentationKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'sme-predictive-engine'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' // Base image (will be updated during deployment)
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsights.properties.ConnectionString
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
  dependsOn: [
    acrPullRole
  ]
}

// ====== Azure Static Web App (Frontend) ======
// Note: Static Web App is deployed via GitHub Actions workflow
// Commenting out to avoid deployment errors with repository URL
/*
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: 'stapp-${resourceToken}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: '' // Will be configured via GitHub Actions
    branch: 'main'
    buildProperties: {
      appLocation: 'frontend'
      apiLocation: ''
      outputLocation: 'build'
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'GitHub'
  }
  tags: {
    'app-component': 'frontend'
  }
}
*/

// ====== Outputs (REQUIRED) ======
output RESOURCE_GROUP_ID string = resourceGroup().id
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.properties.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.name
output BACKEND_URL string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output BACKEND_APP_NAME string = backendApp.name
output ML_SERVICES_URL string = 'https://${mlServicesApp.properties.configuration.ingress.fqdn}'
// output FRONTEND_URL string = 'https://${staticWebApp.properties.defaultHostname}'
// output STATIC_WEB_APP_NAME string = staticWebApp.name
output POSTGRES_SERVER_NAME string = postgresServer.properties.fullyQualifiedDomainName
output REDIS_HOST string = redisCache.properties.hostName
output KEY_VAULT_NAME string = keyVault.name
output MANAGED_IDENTITY_CLIENT_ID string = managedIdentity.properties.clientId
output APPLICATION_INSIGHTS_CONNECTION_STRING string = appInsights.properties.ConnectionString
output CONTAINER_APP_ENVIRONMENT_NAME string = containerAppEnv.name
