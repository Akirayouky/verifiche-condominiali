import jsPDF from 'jspdf'

export interface LavorazionePDF {
  id: string
  titolo: string
  descrizione: string
  stato: string
  priorita: string
  data_apertura: string
  data_completamento?: string
  condominio?: {
    nome: string
    indirizzo?: string
  }
  utente?: {
    nome: string
    cognome: string
    email: string
  }
  note?: string
  allegati?: string
  dati_completamento?: any
  firma?: string  // URL firma digitale
  geolocations?: Array<{  // GPS metadata per foto
    fotoUrl: string
    latitude: number
    longitude: number
    accuracy?: number
  }>
  // Campi integrazione
  lavorazione_originale_id?: string
  motivo_integrazione?: string
  data_integrazione?: string
  dati_verifiche?: any
}

export class PDFGenerator {
  private doc: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number

  constructor() {
    this.doc = new jsPDF()
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = 20
    this.currentY = this.margin
  }

  private addTitle(text: string, fontSize = 18) {
    // Box colorato per il titolo principale
    const boxHeight = fontSize * 1.5
    this.doc.setFillColor(59, 130, 246) // blue-600
    this.doc.roundedRect(this.margin, this.currentY - 5, this.pageWidth - (this.margin * 2), boxHeight, 3, 3, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin + 5, this.currentY + fontSize * 0.5)
    
    // Reset colore
    this.doc.setTextColor(0, 0, 0)
    this.currentY += boxHeight + 10
  }

  private addSubtitle(text: string, fontSize = 14) {
    // Box azzurro chiaro per sottotitoli
    const boxHeight = fontSize * 1.2
    this.doc.setFillColor(219, 234, 254) // blue-100
    this.doc.roundedRect(this.margin, this.currentY - 3, this.pageWidth - (this.margin * 2), boxHeight, 2, 2, 'F')
    
    this.doc.setTextColor(30, 64, 175) // blue-800
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin + 3, this.currentY + fontSize * 0.5)
    
    // Reset colore
    this.doc.setTextColor(0, 0, 0)
    this.currentY += boxHeight + 8
  }

  private addText(text: string, fontSize = 11, style: 'normal' | 'bold' = 'normal') {
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', style)
    
    // Gestisce testo multi-linea
    const maxWidth = this.pageWidth - (this.margin * 2)
    const lines = this.doc.splitTextToSize(text, maxWidth)
    
    for (const line of lines) {
      if (this.currentY > this.pageHeight - this.margin - 20) {
        this.addNewPage()
      }
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += fontSize * 0.6
    }
  }

  private addKeyValue(key: string, value: string, fontSize = 11, icon?: string) {
    this.doc.setFontSize(fontSize)
    
    // Aggiungi icona se presente
    let startX = this.margin + 5
    if (icon) {
      this.doc.setFontSize(fontSize + 2)
      this.doc.text(icon, this.margin + 2, this.currentY)
      startX = this.margin + 10
    }
    
    // Key in grassetto con colore blu
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(30, 64, 175) // blue-800
    const keyWidth = this.doc.getTextWidth(key + ': ')
    this.doc.text(key + ':', startX, this.currentY)
    
    // Value normale in nero
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(60, 60, 60)
    
    const maxWidth = this.pageWidth - startX - keyWidth - 15
    const lines = this.doc.splitTextToSize(value, maxWidth)
    
    let firstLine = true
    for (const line of lines) {
      if (this.currentY > this.pageHeight - this.margin - 20) {
        this.addNewPage()
        firstLine = true
      }
      
      const x = firstLine ? startX + keyWidth + 5 : startX + 5
      this.doc.text(line, x, this.currentY)
      this.currentY += fontSize * 0.6
      firstLine = false
    }
    
    // Reset colore
    this.doc.setTextColor(0, 0, 0)
  }

  private addSeparator() {
    this.currentY += 5
    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 8
  }

  private addInfoBox(text: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') {
    const colors = {
      success: { bg: [220, 252, 231] as [number, number, number], border: [34, 197, 94] as [number, number, number], text: [21, 128, 61] as [number, number, number] }, // green
      warning: { bg: [254, 243, 199] as [number, number, number], border: [245, 158, 11] as [number, number, number], text: [161, 98, 7] as [number, number, number] }, // amber
      info: { bg: [219, 234, 254] as [number, number, number], border: [59, 130, 246] as [number, number, number], text: [30, 64, 175] as [number, number, number] }, // blue
      error: { bg: [254, 226, 226] as [number, number, number], border: [239, 68, 68] as [number, number, number], text: [153, 27, 27] as [number, number, number] } // red
    }
    
    const color = colors[type]
    const maxWidth = this.pageWidth - (this.margin * 2) - 10
    const lines = this.doc.splitTextToSize(text, maxWidth)
    const boxHeight = (lines.length * 5) + 10
    
    // Verifica spazio
    if (this.currentY + boxHeight > this.pageHeight - this.margin - 20) {
      this.addNewPage()
    }
    
    // Background
    this.doc.setFillColor(...color.bg)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), boxHeight, 2, 2, 'F')
    
    // Border
    this.doc.setDrawColor(...color.border)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), boxHeight, 2, 2, 'S')
    this.doc.setLineWidth(0.2) // Reset
    
    // Text
    this.doc.setTextColor(...color.text)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    
    let textY = this.currentY + 7
    for (const line of lines) {
      this.doc.text(line, this.margin + 5, textY)
      textY += 5
    }
    
    this.currentY += boxHeight + 5
    
    // Reset
    this.doc.setTextColor(0, 0, 0)
    this.doc.setDrawColor(0, 0, 0)
  }

  private addNewPage() {
    this.doc.addPage()
    this.currentY = this.margin
  }

  private async addImage(imageUrl: string, maxWidth: number = 150, maxHeight: number = 150) {
    try {
      console.log('🖼️ Tentativo caricamento immagine:', imageUrl.substring(0, 100))
      
      let base64: string
      let format: string
      
      // Se l'immagine è già in base64 (firma digitale locale)
      if (imageUrl.startsWith('data:image/')) {
        console.log('✅ Immagine già in formato base64')
        base64 = imageUrl
        format = imageUrl.includes('png') ? 'PNG' : 'JPEG'
      } else {
        // Usa il proxy API per scaricare immagini esterne (risolve CORS)
        console.log('🌐 Download immagine tramite proxy API...')
        
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
        const response = await fetch(proxyUrl)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Proxy error: ${errorData.error || response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!data.success || !data.dataUrl) {
          throw new Error('Proxy non ha restituito dataUrl')
        }
        
        console.log('✅ Immagine scaricata tramite proxy:', data.size, 'bytes')
        base64 = data.dataUrl
        format = data.type.includes('png') ? 'PNG' : 'JPEG'
      }

      // Calcola dimensioni mantenendo aspect ratio
      const img = new Image()
      img.src = base64
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => reject(new Error('Errore caricamento immagine in canvas'))
        setTimeout(() => reject(new Error('Timeout caricamento immagine')), 5000)
      })
      
      console.log('✅ Immagine caricata in canvas:', img.width, 'x', img.height)
      
      const aspectRatio = img.width / img.height
      let width = maxWidth
      let height = maxWidth / aspectRatio
      
      if (height > maxHeight) {
        height = maxHeight
        width = maxHeight * aspectRatio
      }
      
      // Controlla se serve nuova pagina
      if (this.currentY + height > this.pageHeight - this.margin - 20) {
        this.addNewPage()
      }
      
      // Aggiungi immagine al PDF
      this.doc.addImage(base64, format, this.margin, this.currentY, width, height)
      this.currentY += height + 10
      
      return true
    } catch (error) {
      console.error('❌ Errore aggiunta immagine al PDF:', error)
      return false
    }
  }

  private addHeader() {
    // Logo/Header azienda (placeholder)
    this.doc.setFillColor(59, 130, 246) // blue-600
    this.doc.rect(0, 0, this.pageWidth, 15, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('VERIFICHE CONDOMINIALI - REPORT LAVORAZIONE', this.margin, 10)
    
    // Reset colori
    this.doc.setTextColor(0, 0, 0)
    this.currentY = 25
  }

  private addFooter() {
    const pageCount = (this.doc as any).getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Data generazione
      const now = new Date()
      const dateStr = now.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(100, 100, 100)
      
      // Testo footer
      const footerText = `Report generato il ${dateStr}`
      this.doc.text(footerText, this.margin, this.pageHeight - 15)
      
      // Numero pagina
      const pageText = `Pagina ${i} di ${pageCount}`
      const pageTextWidth = this.doc.getTextWidth(pageText)
      this.doc.text(pageText, this.pageWidth - this.margin - pageTextWidth, this.pageHeight - 15)
      
      // Linea separatrice
      this.doc.setDrawColor(200, 200, 200)
      this.doc.line(this.margin, this.pageHeight - 20, this.pageWidth - this.margin, this.pageHeight - 20)
    }
    
    this.doc.setTextColor(0, 0, 0) // Reset colore
  }

  private getStatoLabel(stato: string): string {
    switch (stato) {
      case 'da_eseguire': return 'DA ESEGUIRE'
      case 'in_corso': return 'IN CORSO'
      case 'completata': return 'COMPLETATA'
      case 'riaperta': return 'RIAPERTA'
      case 'archiviata': return 'ARCHIVIATA'
      default: return stato.toUpperCase()
    }
  }

  private getPrioritaLabel(priorita: string): string {
    switch (priorita) {
      case 'bassa': return 'BASSA'
      case 'media': return 'MEDIA'
      case 'alta': return 'ALTA'
      default: return priorita.toUpperCase()
    }
  }

  generateLavorazionePDF(lavorazione: LavorazionePDF): Promise<Blob> {
    return this._generatePDF(lavorazione)
  }

  private async _generateIntegrazionePDF(lavorazione: LavorazionePDF): Promise<Blob> {
    console.log('⚡ Generazione PDF Integrazione con dati:', {
      id: lavorazione.id,
      lavorazione_originale_id: lavorazione.lavorazione_originale_id,
      motivo: lavorazione.motivo_integrazione,
      hasDatiVerifiche: !!lavorazione.dati_verifiche
    })
    
    // Header
    this.addHeader()
    
    // Titolo principale con badge INTEGRAZIONE
    this.addTitle(`⚡ REPORT INTEGRAZIONE`)
    
    // Box informativo verde per integrazione
    this.addInfoBox(
      `Integrazione completata • ID: ${lavorazione.id.substring(0, 8)}... • Generato: ${new Date().toLocaleDateString('it-IT')}`,
      'success'
    )
    
    // Riferimento alla lavorazione originale
    this.addSubtitle('🔗 LAVORAZIONE ORIGINALE')
    this.addKeyValue(
      'ID Originale', 
      lavorazione.lavorazione_originale_id?.substring(0, 8) + '...' || 'N/D'
    )
    if (lavorazione.motivo_integrazione) {
      this.addKeyValue('Motivo Integrazione', lavorazione.motivo_integrazione)
    }
    this.addSeparator()
    
    // Informazioni generali
    this.addSubtitle('INFORMAZIONI GENERALI')
    this.addKeyValue('Descrizione', lavorazione.descrizione)
    this.addKeyValue('Priorità', this.getPrioritaLabel(lavorazione.priorita))
    this.addSeparator()
    
    // Condominio
    if (lavorazione.condominio) {
      this.addSubtitle('CONDOMINIO')
      this.addKeyValue('Nome', lavorazione.condominio.nome)
      if (lavorazione.condominio.indirizzo) {
        this.addKeyValue('Indirizzo', lavorazione.condominio.indirizzo)
      }
      this.addSeparator()
    }
    
    // Sopralluoghista
    if (lavorazione.utente) {
      this.addSubtitle('SOPRALLUOGHISTA')
      this.addKeyValue('Nome', `${lavorazione.utente.nome} ${lavorazione.utente.cognome}`)
      this.addKeyValue('Email', lavorazione.utente.email)
      this.addSeparator()
    }
    
    // Timeline integrazione
    this.addSubtitle('TIMELINE')
    this.addKeyValue('Data Creazione Integrazione', new Date(lavorazione.data_apertura).toLocaleString('it-IT'))
    if (lavorazione.data_integrazione) {
      this.addKeyValue('Data Completamento', new Date(lavorazione.data_integrazione).toLocaleString('it-IT'))
    }
    this.addSeparator()
    
    // Dati verifiche compilati (campi_nuovi)
    if (lavorazione.dati_verifiche) {
      this.addSubtitle('DATI COMPILATI')
      
      Object.entries(lavorazione.dati_verifiche).forEach(([key, value]) => {
        // Salta gli array di foto
        if (Array.isArray(value) && value.length > 0 && 
            typeof value[0] === 'string' && value[0].includes('blob.vercel-storage.com')) {
          return
        }
        
        // Formatta il valore
        let displayValue: string
        if (typeof value === 'boolean') {
          displayValue = value ? '✓ Sì' : '✗ No'
        } else if (Array.isArray(value)) {
          displayValue = value.join(', ')
        } else {
          displayValue = String(value)
        }
        
        // Formatta la chiave (rimuovi underscore e capitalizza)
        const displayKey = key
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        
        this.addKeyValue(displayKey, displayValue)
      })
      
      this.addSeparator()
    }
    
    // Foto dell'integrazione
    if (lavorazione.dati_verifiche) {
      const fotoFields = Object.entries(lavorazione.dati_verifiche).filter(
        ([key, value]) => Array.isArray(value) && value.length > 0 && 
        typeof value[0] === 'string' && value[0].includes('blob.vercel-storage.com')
      )
      
      if (fotoFields.length > 0) {
        this.addSubtitle('📸 DOCUMENTAZIONE FOTOGRAFICA')
        
        for (const [nomeCampo, fotoArray] of fotoFields) {
          // Titolo campo foto
          const titoloCampo = nomeCampo
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          this.doc.setFontSize(11)
          this.doc.setFont('helvetica', 'bold')
          this.doc.setTextColor(34, 197, 94) // green-600
          this.doc.text(titoloCampo, this.margin, this.currentY)
          this.currentY += 8
          this.doc.setTextColor(0, 0, 0)
          this.doc.setFont('helvetica', 'normal')
          
          // Aggiungi ogni foto
          for (const fotoUrl of fotoArray as string[]) {
            if (typeof fotoUrl === 'string') {
              console.log(`📸 Aggiungendo foto integrazione:`, fotoUrl)
              const successo = await this.addImage(fotoUrl, 140, 140)
              if (!successo) {
                console.error(`❌ Impossibile aggiungere foto da ${titoloCampo}`)
              }
              
              // GPS se disponibile
              const geoData = lavorazione.geolocations?.find(g => g.fotoUrl === fotoUrl)
              if (geoData) {
                this.currentY += 3
                this.doc.setFontSize(9)
                this.doc.setFont('helvetica', 'bold')
                this.doc.setTextColor(34, 197, 94) // green-600
                this.doc.text('UBICAZIONE FOTO', this.margin, this.currentY)
                this.currentY += 5
                
                this.doc.setFont('helvetica', 'normal')
                this.doc.setTextColor(60, 60, 60)
                this.doc.text(`Latitudine: ${geoData.latitude.toFixed(6)}°`, this.margin, this.currentY)
                this.currentY += 4
                this.doc.text(`Longitudine: ${geoData.longitude.toFixed(6)}°`, this.margin, this.currentY)
                this.currentY += 4
                
                if (geoData.accuracy) {
                  this.doc.text(`Precisione: ±${geoData.accuracy.toFixed(0)} metri`, this.margin, this.currentY)
                  this.currentY += 4
                }
                
                const mapsLink = `https://maps.google.com/?q=${geoData.latitude},${geoData.longitude}`
                this.doc.setTextColor(34, 197, 94)
                this.doc.text('Vedi su Google Maps', this.margin, this.currentY)
                this.doc.link(this.margin, this.currentY - 3, 40, 4, { url: mapsLink })
                this.currentY += 7
                this.doc.setTextColor(0, 0, 0)
              }
              
              this.currentY += 5
            }
          }
        }
      }
    }
    
    // Note
    if (lavorazione.note) {
      this.addSubtitle('NOTE')
      this.addText(lavorazione.note, 10)
      this.addSeparator()
    }
    
    // Footer
    this.addFooter()
    
    // Download
    console.log('✅ PDF Integrazione generato con successo')
    return this.doc.output('blob')
  }

  private async _generatePDF(lavorazione: LavorazionePDF): Promise<Blob> {
    console.log('📄 Generazione PDF con dati:', {
      id: lavorazione.id,
      hasFirma: !!lavorazione.firma,
      firmaUrl: lavorazione.firma,
      hasGeolocations: !!lavorazione.geolocations,
      geolocationsCount: lavorazione.geolocations?.length || 0,
      isIntegrazione: !!lavorazione.lavorazione_originale_id
    })
    
    // Verifica se è un'integrazione
    if (lavorazione.lavorazione_originale_id) {
      return this._generateIntegrazionePDF(lavorazione)
    }
    
    // Header
    this.addHeader()
    
    // Titolo principale
    this.addTitle(`REPORT LAVORAZIONE`)
    
    // Box informativo con stato
    let statoType: 'success' | 'warning' | 'info' | 'error' = 'info'
    if (lavorazione.stato === 'completata') statoType = 'success'
    else if (lavorazione.stato === 'in_corso') statoType = 'warning'
    else if (lavorazione.stato === 'da_eseguire') statoType = 'info'
    
    this.addInfoBox(
      `Stato: ${this.getStatoLabel(lavorazione.stato)} • ID: ${lavorazione.id.substring(0, 8)}... • Generato: ${new Date().toLocaleDateString('it-IT')}`,
      statoType
    )
    
    // ID e titolo
    this.addKeyValue('Titolo', lavorazione.titolo || lavorazione.descrizione, 12)
    this.addSeparator()
    
    // Informazioni generali
    this.addSubtitle('INFORMAZIONI GENERALI')
    this.addKeyValue('Descrizione', lavorazione.descrizione)
    this.addKeyValue('Priorità', this.getPrioritaLabel(lavorazione.priorita))
    this.addSeparator()
    
    // Condominio
    if (lavorazione.condominio) {
      this.addSubtitle('CONDOMINIO')
      this.addKeyValue('Nome', lavorazione.condominio.nome)
      if (lavorazione.condominio.indirizzo) {
        this.addKeyValue('Indirizzo', lavorazione.condominio.indirizzo)
      }
      this.addSeparator()
    }
    
    // Assegnazione
    if (lavorazione.utente) {
      this.addSubtitle('SOPRALLUOGHISTA ASSEGNATO')
      this.addKeyValue('Nome', `${lavorazione.utente.nome} ${lavorazione.utente.cognome}`)
      this.addKeyValue('Email', lavorazione.utente.email)
      this.addSeparator()
    }
    
    // Timeline
    this.addSubtitle('TIMELINE')
    this.addKeyValue('Data Apertura', new Date(lavorazione.data_apertura).toLocaleString('it-IT'))
    if (lavorazione.data_completamento) {
      this.addKeyValue('Data Completamento', new Date(lavorazione.data_completamento).toLocaleString('it-IT'))
    }
    this.addSeparator()
    
    // Tipologia e dettagli
    if (lavorazione.allegati) {
      try {
        const metadata = JSON.parse(lavorazione.allegati)
        this.addSubtitle('TIPOLOGIA VERIFICA')
        
        let tipoLabel = 'Altro'
        if (metadata.tipologia === 'manutenzione') tipoLabel = 'Manutenzione Ordinaria'
        else if (metadata.tipologia === 'riparazione') tipoLabel = 'Riparazione Urgente'
        else if (metadata.tipologia === 'verifica') tipoLabel = 'Verifica Tecnica'
        else if (metadata.tipologia === 'sicurezza') tipoLabel = 'Sicurezza e Conformità'
        else if (metadata.tipologia === 'pulizia') tipoLabel = 'Pulizia Straordinaria'
        
        this.addKeyValue('Tipo Verifica', tipoLabel)
        
        // Dati del completamento
        if (metadata.dati_verifica_completamento) {
          this.addSubtitle('RISULTATI VERIFICA')
          const dati = metadata.dati_verifica_completamento
          
          Object.entries(dati).forEach(([key, value]) => {
            // Salta i campi foto (array di URL Vercel Blob)
            if (Array.isArray(value) && value.length > 0 && 
                typeof value[0] === 'string' && value[0].includes('blob.vercel-storage.com')) {
              return // Non mostrare array foto come testo
            }
            
            if (typeof value === 'boolean') {
              this.addKeyValue(key, value ? '✓ Conforme' : '✗ Non conforme')
            } else {
              this.addKeyValue(key, String(value))
            }
          })
        }
        
        // Foto dalla verifica (Vercel Blob o Cloudinary)
        if (metadata.foto) {
          // Supporta sia oggetto per sezione che array legacy
          if (typeof metadata.foto === 'object' && !Array.isArray(metadata.foto)) {
            // Nuovo formato: oggetto con foto per sezione
            this.addSubtitle('DOCUMENTAZIONE FOTOGRAFICA')
            
            for (const [nomeSezione, fotoArray] of Object.entries(metadata.foto)) {
              if (Array.isArray(fotoArray) && fotoArray.length > 0) {
                // Titolo sezione (es: "Foto Estintori")
                const titoloSezione = nomeSezione
                  .replace(/_/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')
                
                this.doc.setFontSize(11)
                this.doc.setFont('helvetica', 'bold')
                this.doc.setTextColor(0, 102, 204) // Blu
                this.doc.text(titoloSezione, this.margin, this.currentY)
                this.currentY += 8
                this.doc.setTextColor(0, 0, 0)
                this.doc.setFont('helvetica', 'normal')
                
                // Aggiungi foto della sezione
                for (const fotoUrl of fotoArray as string[]) {
                  if (typeof fotoUrl === 'string') {
                    console.log(`📸 Aggiungendo foto al PDF (${titoloSezione}):`, fotoUrl)
                    const successo = await this.addImage(fotoUrl, 140, 140)
                    if (!successo) {
                      console.error(`❌ Impossibile aggiungere foto da ${titoloSezione}`)
                    }
                    
                    // Aggiungi sezione UBICAZIONE con coordinate GPS se disponibili
                    const geoData = lavorazione.geolocations?.find(g => g.fotoUrl === fotoUrl)
                    if (geoData) {
                      console.log('� Trovato GPS per foto:', fotoUrl, geoData)
                      
                      // Sezione UBICAZIONE
                      this.currentY += 3
                      this.doc.setFontSize(9)
                      this.doc.setFont('helvetica', 'bold')
                      this.doc.setTextColor(59, 130, 246) // blue-600
                      this.doc.text('UBICAZIONE FOTO', this.margin, this.currentY)
                      this.currentY += 5
                      
                      // Coordinate GPS
                      this.doc.setFont('helvetica', 'normal')
                      this.doc.setTextColor(60, 60, 60)
                      this.doc.text(`Latitudine: ${geoData.latitude.toFixed(6)}°`, this.margin, this.currentY)
                      this.currentY += 4
                      this.doc.text(`Longitudine: ${geoData.longitude.toFixed(6)}°`, this.margin, this.currentY)
                      this.currentY += 4
                      
                      if (geoData.accuracy) {
                        this.doc.text(`Precisione: ±${geoData.accuracy.toFixed(0)} metri`, this.margin, this.currentY)
                        this.currentY += 4
                      }
                      
                      // Link Google Maps
                      this.doc.setTextColor(59, 130, 246)
                      const mapsLink = `https://maps.google.com/?q=${geoData.latitude},${geoData.longitude}`
                      this.doc.textWithLink('Visualizza su Google Maps', this.margin, this.currentY, { url: mapsLink })
                      this.currentY += 5
                      
                      // Reset colori
                      this.doc.setTextColor(0, 0, 0)
                      this.doc.setFontSize(10)
                    }
                  }
                }
                
                this.currentY += 5 // Spazio tra sezioni
              }
            }
          } else if (Array.isArray(metadata.foto) && metadata.foto.length > 0) {
            // Formato legacy: array di stringhe o oggetti {url}
            this.addSubtitle('DOCUMENTAZIONE FOTOGRAFICA')
            
            for (const foto of metadata.foto) {
              // Supporta sia stringhe URL (Vercel Blob) che oggetti {url, createdAt} (Cloudinary)
              const fotoUrl = typeof foto === 'string' ? foto : foto.url
              
              if (fotoUrl) {
                console.log(`📸 Aggiungendo foto al PDF (legacy):`, fotoUrl)
                const successo = await this.addImage(fotoUrl, 140, 140)
                if (!successo) {
                  console.error(`❌ Impossibile aggiungere foto`)
                }
                
                // Aggiungi sezione UBICAZIONE con coordinate GPS se disponibili (legacy)
                const geoData = lavorazione.geolocations?.find(g => g.fotoUrl === fotoUrl)
                if (geoData) {
                  console.log('� Trovato GPS per foto:', fotoUrl, geoData)
                  
                  // Sezione UBICAZIONE
                  this.currentY += 3
                  this.doc.setFontSize(9)
                  this.doc.setFont('helvetica', 'bold')
                  this.doc.setTextColor(59, 130, 246) // blue-600
                  this.doc.text('UBICAZIONE FOTO', this.margin, this.currentY)
                  this.currentY += 5
                  
                  // Coordinate GPS
                  this.doc.setFont('helvetica', 'normal')
                  this.doc.setTextColor(60, 60, 60)
                  this.doc.text(`Latitudine: ${geoData.latitude.toFixed(6)}°`, this.margin, this.currentY)
                  this.currentY += 4
                  this.doc.text(`Longitudine: ${geoData.longitude.toFixed(6)}°`, this.margin, this.currentY)
                  this.currentY += 4
                  
                  if (geoData.accuracy) {
                    this.doc.text(`Precisione: ±${geoData.accuracy.toFixed(0)} metri`, this.margin, this.currentY)
                    this.currentY += 4
                  }
                  
                  // Link Google Maps
                  this.doc.setTextColor(59, 130, 246)
                  const mapsLink = `https://maps.google.com/?q=${geoData.latitude},${geoData.longitude}`
                  this.doc.textWithLink('Visualizza su Google Maps', this.margin, this.currentY, { url: mapsLink })
                  this.currentY += 5
                  
                  // Reset colori
                  this.doc.setTextColor(0, 0, 0)
                  this.doc.setFontSize(10)
                } else if (lavorazione.geolocations && lavorazione.geolocations.length > 0) {
                  console.log('⚠️ GPS disponibile ma non trovato per questa foto:', fotoUrl)
                }
              }
            }
          }
        }
        
        this.addSeparator()
      } catch (e) {
        // Ignora errori di parsing JSON
      }
    }
    
    // Note
    if (lavorazione.note && lavorazione.note.trim()) {
      this.addSubtitle('NOTE AGGIUNTIVE')
      this.addInfoBox(lavorazione.note, 'info')
    }
    
    // SEZIONE FIRMA DIGITALE - Sempre visibile per debug
    this.addSubtitle('FIRMA DIGITALE')
    console.log('🖊️ DEBUG FIRMA nel PDF:', {
      hasFirma: !!lavorazione.firma,
      firmaUrl: lavorazione.firma ? lavorazione.firma.substring(0, 50) + '...' : null,
      firmaType: typeof lavorazione.firma,
      statoLavorazione: lavorazione.stato
    })
    
    if (lavorazione.firma) {
      console.log('✍️ Tentativo aggiunta firma al PDF')
      this.addInfoBox('Firma digitale del sopralluoghista certificata dal sistema', 'success')
      this.currentY += 5
      
      try {
        const firmaSuccess = await this.addImage(lavorazione.firma, 120, 50)
        if (firmaSuccess) {
          console.log('✅ Firma aggiunta al PDF con successo')
          this.currentY += 3
          this.doc.setFontSize(8)
          this.doc.setTextColor(100, 100, 100)
          this.doc.setFont('helvetica', 'italic')
          this.doc.text('Firma digitale acquisita e validata dal sistema', this.margin + 5, this.currentY)
          this.doc.setTextColor(0, 0, 0)
          this.doc.setFont('helvetica', 'normal')
          this.currentY += 10
        } else {
          console.error('❌ Firma non aggiunta (addImage returned false)')
          this.addInfoBox('Errore: Firma non caricabile', 'error')
        }
      } catch (error) {
        console.error('❌ Errore aggiunta firma al PDF:', error)
        this.addInfoBox(`Errore caricamento firma: ${error}`, 'error')
      }
    } else {
      this.addInfoBox('Firma non disponibile - La lavorazione non è stata ancora completata', 'warning')
    }
    this.addSeparator()
    
    // Validazione finale
    this.addSubtitle('VALIDAZIONE DOCUMENTO')
    this.addInfoBox(
      'Documento generato automaticamente dal Sistema di Gestione Verifiche Condominiali' +
      `\nData e ora generazione: ${new Date().toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'long' })}` +
      (lavorazione.stato === 'completata' ? '\nVerifica completata e validata dal sopralluoghista assegnato' : ''),
      'info'
    )
    
    // Footer
    this.addFooter()
    
    return this.doc.output('blob')
  }

  async downloadPDF(lavorazione: LavorazionePDF, filename?: string) {
    const blob = await this.generateLavorazionePDF(lavorazione)
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `lavorazione-${lavorazione.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}