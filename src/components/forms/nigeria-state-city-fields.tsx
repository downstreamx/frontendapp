import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import InputError from '@/components/ui/input-error'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fetchNigeriaCities, fetchNigeriaStates } from '@/lib/nigeria-geo-api'
import { cn } from '@/lib/utils'

export const DEFAULT_NIGERIA_COUNTRY = 'Nigeria'

export type NigeriaStateCityFieldsProps = {
  idPrefix: string
  stateName: string
  cityName: string
  country: string
  onStateNameChange: (stateName: string) => void
  onCityNameChange: (cityName: string) => void
  onCountryChange?: (country: string) => void
  disabled?: boolean
  required?: boolean
  stateError?: string
  cityError?: string
  countryError?: string
  /** When false, country is fixed to Nigeria (readonly). */
  countryEditable?: boolean
  className?: string
}

export function NigeriaStateCityFields({
  idPrefix,
  stateName,
  cityName,
  country,
  onStateNameChange,
  onCityNameChange,
  onCountryChange,
  disabled = false,
  required = false,
  stateError,
  cityError,
  countryError,
  countryEditable = false,
  className,
}: NigeriaStateCityFieldsProps) {
  const { t } = useTranslation()
  const [selectedStateId, setSelectedStateId] = useState('')

  const { data: states = [] } = useQuery({
    queryKey: ['geo', 'nigeria', 'states'],
    queryFn: fetchNigeriaStates,
  })

  const { data: cities = [] } = useQuery({
    queryKey: ['geo', 'nigeria', 'cities', selectedStateId],
    queryFn: () => fetchNigeriaCities(Number(selectedStateId)),
    enabled: Boolean(selectedStateId),
  })

  useEffect(() => {
    if (!stateName || states.length === 0) {
      return
    }
    const match = states.find((s) => s.name.toLowerCase() === stateName.toLowerCase())
    if (match) {
      setSelectedStateId(String(match.id))
    }
  }, [stateName, states])

  const selectedCityId = useMemo(() => {
    if (!cityName || cities.length === 0) {
      return ''
    }
    const match = cities.find((c) => c.name.toLowerCase() === cityName.toLowerCase())
    return match ? String(match.id) : ''
  }, [cityName, cities])

  const displayCountry = country.trim() !== '' ? country : DEFAULT_NIGERIA_COUNTRY

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId)
    const state = states.find((s) => String(s.id) === stateId)
    onStateNameChange(state?.name ?? '')
    onCityNameChange('')
    onCountryChange?.(DEFAULT_NIGERIA_COUNTRY)
  }

  const handleCityChange = (cityId: string) => {
    const city = cities.find((c) => String(c.id) === cityId)
    onCityNameChange(city?.name ?? '')
    onCountryChange?.(DEFAULT_NIGERIA_COUNTRY)
  }

  return (
    <>
      <div className={cn(className)}>
        <Label htmlFor={`${idPrefix}-state`}>{t('State')}</Label>
        <Select
          value={selectedStateId || undefined}
          onValueChange={handleStateChange}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-state`}>
            <SelectValue placeholder={t('Select state')} />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state.id} value={String(state.id)}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <InputError message={stateError} />
      </div>

      <div className={cn(className)}>
        <Label htmlFor={`${idPrefix}-city`}>{t('City')}</Label>
        <Select
          value={selectedCityId || undefined}
          onValueChange={handleCityChange}
          disabled={disabled || !selectedStateId}
        >
          <SelectTrigger id={`${idPrefix}-city`}>
            <SelectValue placeholder={t('Select city')} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={String(city.id)}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <InputError message={cityError} />
      </div>

      <div className={cn(className)}>
        <Label htmlFor={`${idPrefix}-country`}>{t('Country')}</Label>
        <Input
          id={`${idPrefix}-country`}
          value={displayCountry}
          onChange={
            countryEditable && onCountryChange
              ? (e) => onCountryChange(e.target.value)
              : undefined
          }
          readOnly={!countryEditable}
          placeholder={t('Enter country')}
          required={required}
          disabled={disabled}
        />
        <InputError message={countryError} />
      </div>
    </>
  )
}
