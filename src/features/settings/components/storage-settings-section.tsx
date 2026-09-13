import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HardDrive, Save, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useSettingsContext } from '../context/settings-context'
import type { SettingsSectionProps } from '../types'

const TAB = 'Storage'

type StorageType = 'local' | 'aws_s3' | 'wasabi'

type StorageForm = {
  storageType: StorageType
  allowedFileTypes: string
  maxUploadSize: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
  awsDefaultRegion: string
  awsBucket: string
  awsUrl: string
  awsEndpoint: string
  wasabiAccessKey: string
  wasabiSecretKey: string
  wasabiRegion: string
  wasabiBucket: string
  wasabiUrl: string
  wasabiRoot: string
}

const FILE_EXTENSIONS = [
  '3dmf', '3dm', 'avi', 'ai', 'bin', 'bmp', 'cab', 'c', 'c++', 'class', 'css', 'csv', 'cdr', 'doc',
  'dot', 'docx', 'dwg', 'eps', 'exe', 'gif', 'gz', 'gtar', 'flv', 'fh4', 'fh5', 'fhc', 'help', 'hlp',
  'html', 'htm', 'ico', 'imap', 'inf', 'jpe', 'jpeg', 'jpg', 'js', 'java', 'latex', 'log', 'm3u', 'midi',
  'mid', 'mov', 'mp4', 'mp3', 'mpeg', 'mpg', 'mp2', 'ogg', 'phtml', 'php', 'pdf', 'pgp', 'png', 'pps',
  'ppt', 'ppz', 'pot', 'ps', 'qt', 'qd3d', 'qd3', 'qxd', 'rar', 'ra', 'ram', 'rm', 'rtf', 'spr', 'sprite',
  'stream', 'swf', 'svg', 'sgml', 'sgm', 'tar', 'tiff', 'tif', 'tgz', 'tex', 'txt', 'vob', 'wav', 'wrl',
  'xla', 'xls', 'xlc', 'xml', 'zip', 'json', 'webp',
]

function fromApi(userSettings: Record<string, string>): StorageForm {
  const storageType = (userSettings.storageType as StorageType) || 'local'
  return {
    storageType: ['local', 'aws_s3', 'wasabi'].includes(storageType) ? storageType : 'local',
    allowedFileTypes: userSettings.allowedFileTypes || 'jpg,png,webp,gif',
    maxUploadSize: userSettings.maxUploadSize || '2048',
    awsAccessKeyId: userSettings.awsAccessKeyId || '',
    awsSecretAccessKey: userSettings.awsSecretAccessKey || '',
    awsDefaultRegion: userSettings.awsDefaultRegion || 'us-east-1',
    awsBucket: userSettings.awsBucket || '',
    awsUrl: userSettings.awsUrl || '',
    awsEndpoint: userSettings.awsEndpoint || '',
    wasabiAccessKey: userSettings.wasabiAccessKey || '',
    wasabiSecretKey: userSettings.wasabiSecretKey || '',
    wasabiRegion: userSettings.wasabiRegion || 'us-east-1',
    wasabiBucket: userSettings.wasabiBucket || '',
    wasabiUrl: userSettings.wasabiUrl || '',
    wasabiRoot: userSettings.wasabiRoot || '',
  }
}

export function StorageSettingsSection(_props: SettingsSectionProps) {
  const { t } = useTranslation()
  const { userSettings, saveTab, isSaving, canEdit } = useSettingsContext()
  const canEditSection = canEdit('edit-storage-settings')
  const [searchTerm, setSearchTerm] = useState('')
  const [settings, setSettings] = useState<StorageForm>(() => fromApi(userSettings))

  useEffect(() => {
    setSettings(fromApi(userSettings))
  }, [userSettings])

  const filteredExtensions = useMemo(
    () =>
      FILE_EXTENSIONS.filter((ext) =>
        ext.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm],
  )

  const handleInputChange = (field: keyof StorageForm, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileTypeChange = (extension: string, checked: boolean) => {
    const currentTypes = settings.allowedFileTypes.split(',').filter((type) => type.trim())
    const newTypes = checked
      ? [...currentTypes, extension]
      : currentTypes.filter((type) => type !== extension)
    setSettings((prev) => ({ ...prev, allowedFileTypes: newTypes.join(',') }))
  }

  const handleSave = async () => {
    if (!settings.allowedFileTypes.trim()) {
      toast.error(t('Allowed file types are required.'))
      return
    }
    await saveTab(TAB, settings as unknown as Record<string, string>)
  }

  const renderFileTypeSelector = () => (
    <div className="space-y-2">
      <Label>{t('Allowed File Types')}</Label>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search file types...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={!canEditSection}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                allowedFileTypes: FILE_EXTENSIONS.join(','),
              }))
            }
            disabled={!canEditSection}
          >
            {t('Select All')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSettings((prev) => ({ ...prev, allowedFileTypes: '' }))}
            disabled={!canEditSection}
          >
            {t('Unselect All')}
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-2 p-4 border rounded-md max-h-48 overflow-y-auto">
          {filteredExtensions.map((ext) => (
            <div key={ext} className="flex gap-2 items-center">
              <Checkbox
                id={`storage-ext-${ext}`}
                checked={settings.allowedFileTypes.split(',').includes(ext)}
                onCheckedChange={(checked) =>
                  handleFileTypeChange(ext, checked === true)
                }
                disabled={!canEditSection}
              />
              <Label htmlFor={`storage-ext-${ext}`} className="text-sm font-normal">
                {ext}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const maxUploadField = (
    <div className="space-y-2">
      <Label htmlFor="maxUploadSize">{t('Max Upload Size (KB)')}</Label>
      <Input
        id="maxUploadSize"
        type="number"
        value={settings.maxUploadSize}
        onChange={(e) => handleInputChange('maxUploadSize', e.target.value)}
        placeholder="2048"
        disabled={!canEditSection}
      />
    </div>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="order-1 rtl:order-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5" />
            {t('Storage Settings')}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t('Configure file storage settings for your application')}
          </p>
        </div>
        {canEditSection && (
          <Button className="order-2 rtl:order-1" onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('Saving...') : t('Save Changes')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs
          value={settings.storageType}
          className="w-full"
          onValueChange={(value) =>
            setSettings((prev) => ({ ...prev, storageType: value as StorageType }))
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="local" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              {t('Local Storage')}
            </TabsTrigger>
            <TabsTrigger value="aws_s3" className="flex items-center gap-2">
              <span>☁️</span>
              {t('AWS S3')}
            </TabsTrigger>
            <TabsTrigger value="wasabi" className="flex items-center gap-2">
              <span>🗄️</span>
              {t('Wasabi')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="mt-6 space-y-6">
            <h3 className="text-base font-medium">{t('Local Storage Settings')}</h3>
            {renderFileTypeSelector()}
            {maxUploadField}
          </TabsContent>

          <TabsContent value="aws_s3" className="mt-6 space-y-6">
            <h3 className="text-base font-medium">{t('AWS S3 Storage Settings')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(
                [
                  ['awsAccessKeyId', 'AWS Access Key ID', 'AKIAIOSFODNN7EXAMPLE'],
                  ['awsSecretAccessKey', 'AWS Secret Access Key', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', true],
                  ['awsDefaultRegion', 'AWS Default Region', 'us-east-1'],
                  ['awsBucket', 'AWS Bucket', 'my-bucket-name'],
                  ['awsUrl', 'AWS URL', 'https://s3.amazonaws.com'],
                  ['awsEndpoint', 'AWS Endpoint', 'https://s3.us-east-1.amazonaws.com'],
                ] as const
              ).map(([key, label, placeholder, secret]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{t(label)}</Label>
                  <Input
                    id={key}
                    type={secret ? 'password' : 'text'}
                    value={settings[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={placeholder}
                    disabled={!canEditSection}
                  />
                </div>
              ))}
            </div>
            {renderFileTypeSelector()}
            {maxUploadField}
          </TabsContent>

          <TabsContent value="wasabi" className="mt-6 space-y-6">
            <h3 className="text-base font-medium">{t('Wasabi Storage Settings')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(
                [
                  ['wasabiAccessKey', 'Wasabi Access Key', 'AKIAIOSFODNN7EXAMPLE'],
                  ['wasabiSecretKey', 'Wasabi Secret Key', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', true],
                  ['wasabiRegion', 'Wasabi Region', 'us-east-1'],
                  ['wasabiBucket', 'Wasabi Bucket', 'my-wasabi-bucket'],
                  ['wasabiUrl', 'Wasabi URL', 'https://s3.wasabisys.com'],
                  ['wasabiRoot', 'Wasabi Root', '/'],
                ] as const
              ).map(([key, label, placeholder, secret]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{t(label)}</Label>
                  <Input
                    id={key}
                    type={secret ? 'password' : 'text'}
                    value={settings[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={placeholder}
                    disabled={!canEditSection}
                  />
                </div>
              ))}
            </div>
            {renderFileTypeSelector()}
            {maxUploadField}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
