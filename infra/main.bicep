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

// Resource name prefixes (3 chars max)
var keyVaultPrefix = 'kv'
var containerRegistryPrefix = 'acr'
var logAnalyticsPrefix = 'log'
var containerAppEnvPrefix = 'cae'
var postgresPrefix = 'psql'
var redisPrefix = 'rds'
var managedIdentityPrefix = 'id'

// Resource names (max 32 chars total)
var keyVaultName = take('${keyVaultPrefix}${resourceToken}', 24)
var containerRegistryName = take('${containerRegistryPrefix}${resourceToken}', 32)
var logAnalyticsName = take('${logAnalyticsPrefix}${resourceToken}', 32)
var containerAppEnvName = take('${containerAppEnvPrefix}${resourceToken}', 32)
var postgresServerName = take('${postgresPrefix}${resourceToken}', 32)
var redisName = take('${redisPrefix}${resourceToken}', 32)
var managedIdentityName = take('${managedIdentityPrefix}${resourceToken}', 32)

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
  name: 'appi-${resourceToken}'
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
    value: 'postgresql://${postgresAdminUser}:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${postgresDatabaseName}?sslmode=require'
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

// ====== Container Apps Environment ======
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

// ====== Backend Container App (Spring Boot) ======
resource backendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'backend'
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
          name: 'postgres-connection'
          keyVaultUrl: postgresConnectionStringSecret.properties.secretUri
          identity: managedIdentity.id
        }
        {
          name: 'redis-connection'
          keyVaultUrl: redisConnectionStringSecret.properties.secretUri
          identity: managedIdentity.id
        }
        {
          name: 'appinsights-key'
          value: appInsights.properties.InstrumentationKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
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
              name: 'DATABASE_URL'
              secretRef: 'postgres-connection'
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
              secretRef: 'redis-connection'
            }
            {
              name: 'SPRING_REDIS_SSL'
              value: 'true'
            }
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

// ====== ML Services Container App (FastAPI) ======
resource mlServicesApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ml-services'
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
          name: 'ml-services'
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

// ====== Frontend Container App (React + Nginx) ======
resource frontendApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'frontend'
  location: location
  tags: {
    'azd-service-name': 'frontend'
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
        targetPort: 3000
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: false
        }
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          identity: managedIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' // Base image (will be updated during deployment)
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'REACT_APP_BACKEND_URL'
              value: 'https://${backendApp.properties.configuration.ingress.fqdn}'
            }
            {
              name: 'REACT_APP_ML_URL'
              value: 'https://${mlServicesApp.properties.configuration.ingress.fqdn}'
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

// ====== Outputs (REQUIRED) ======
output RESOURCE_GROUP_ID string = resourceGroup().id
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.properties.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.name
output BACKEND_URL string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output ML_SERVICES_URL string = 'https://${mlServicesApp.properties.configuration.ingress.fqdn}'
output FRONTEND_URL string = 'https://${frontendApp.properties.configuration.ingress.fqdn}'
output POSTGRES_SERVER_NAME string = postgresServer.properties.fullyQualifiedDomainName
output REDIS_HOST string = redisCache.properties.hostName
output KEY_VAULT_NAME string = keyVault.name
output MANAGED_IDENTITY_CLIENT_ID string = managedIdentity.properties.clientId
output APPLICATION_INSIGHTS_CONNECTION_STRING string = appInsights.properties.ConnectionString
