{{/*
Expand the name of the chart.
*/}}
{{- define "seo-platform.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "seo-platform.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "seo-platform.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "seo-platform.labels" -}}
helm.sh/chart: {{ include "seo-platform.chart" . }}
{{ include "seo-platform.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "seo-platform.selectorLabels" -}}
app.kubernetes.io/name: {{ include "seo-platform.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "seo-platform.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "seo-platform.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Image registry
*/}}
{{- define "seo-platform.registry" -}}
{{- .Values.global.registry }}
{{- end }}

{{/*
Backend image
*/}}
{{- define "backend.image" -}}
{{ include "seo-platform.registry" . }}/{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}
{{- end }}

{{/*
Crawler image
*/}}
{{- define "crawler.image" -}}
{{ include "seo-platform.registry" . }}/{{ .Values.crawler.image.repository }}:{{ .Values.crawler.image.tag }}
{{- end }}

{{/*
ML Service image
*/}}
{{- define "mlService.image" -}}
{{ include "seo-platform.registry" . }}/{{ .Values.mlService.image.repository }}:{{ .Values.mlService.image.tag }}
{{- end }}

{{/*
Frontend image
*/}}
{{- define "frontend.image" -}}
{{ include "seo-platform.registry" . }}/{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}
{{- end }}
