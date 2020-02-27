import { useState } from 'react'
import { useHistory } from 'react-router'
import ApiClient from '../utils/api-client'
import RecordJSON from '../../backend/decorators/record-json.interface'
import { NoticeMessage } from '../store/with-notice'
import recordToFormData from '../components/actions/record-to-form-data'
import { appendForceRefresh } from '../components/actions/utils/append-force-refresh'
import useTranslation from './use-translation'

const api = new ApiClient()

interface ResourceNew {
  record: RecordJSON;
  handleChange: (propertyOrRecord: string | RecordJSON, value?: any) => void;
  handleSubmit: (event: any) => boolean;
  loading: boolean;
}

const useResourceNew = (
  initialRecord: RecordJSON | undefined,
  resourceId: string,
  onNotice: (notice: NoticeMessage) => void,
): ResourceNew => {
  const [record, setRecord] = useState<RecordJSON>({
    ...initialRecord,
    params: initialRecord?.params ?? {},
    errors: initialRecord?.errors ?? {},
    populated: initialRecord?.populated ?? {},
  } as any)
  const [loading, setLoading] = useState(false)
  const history = useHistory()
  const { translateMessage } = useTranslation()

  const handleChange = (
    propertyOrRecord: RecordJSON | string,
    value?: any,
  ): void => {
    if (
      typeof value === 'undefined'
      && !(typeof propertyOrRecord === 'string')
      && propertyOrRecord.params
    ) {
      setRecord(propertyOrRecord)
    } else {
      setRecord(prev => ({
        ...prev,
        params: { ...prev.params, [propertyOrRecord as string]: value },
      }))
    }
  }

  const handleSubmit = (event): boolean => {
    const formData = recordToFormData(record)
    setLoading(true)
    api
      .resourceAction({
        resourceId,
        actionName: 'new',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((response) => {
        if (response.data.notice) {
          onNotice(response.data.notice)
        }
        if (response.data.redirectUrl) {
          history.push(appendForceRefresh(response.data.redirectUrl))
        } else {
          setRecord(prev => ({ ...prev, errors: response.data.record.errors }))
          setLoading(false)
        }
      })
      .catch((error) => {
        setLoading(false)
        onNotice({
          message: translateMessage(error.response?.data.message ?? 'errorFetchingRecord'),
          type: 'error',
        })
      })
    event.preventDefault()
    return false
  }

  return { record, handleChange, handleSubmit, loading }
}

export default useResourceNew
