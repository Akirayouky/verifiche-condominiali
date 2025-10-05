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
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin, this.currentY)
    this.currentY += fontSize * 0.7
  }

  private addSubtitle(text: string, fontSize = 14) {
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(text, this.margin, this.currentY)
    this.currentY += fontSize * 0.6
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

  private addKeyValue(key: string, value: string, fontSize = 11) {
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    
    const keyWidth = this.doc.getTextWidth(key + ': ')
    this.doc.text(key + ':', this.margin, this.currentY)
    
    this.doc.setFont('helvetica', 'normal')
    
    const maxWidth = this.pageWidth - this.margin - keyWidth - 10
    const lines = this.doc.splitTextToSize(value, maxWidth)
    
    let firstLine = true
    for (const line of lines) {
      if (this.currentY > this.pageHeight - this.margin - 20) {
        this.addNewPage()
        firstLine = true
      }
      
      const x = firstLine ? this.margin + keyWidth + 5 : this.margin
      this.doc.text(line, x, this.currentY)
      this.currentY += fontSize * 0.6
      firstLine = false
    }
  }

  private addSeparator() {
    this.currentY += 5
    this.doc.setDrawColor(200, 200, 200)
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 8
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

  private async _generatePDF(lavorazione: LavorazionePDF): Promise<Blob> {
    console.log('📄 Generazione PDF con dati:', {
      id: lavorazione.id,
      hasFirma: !!lavorazione.firma,
      firmaUrl: lavorazione.firma,
      hasGeolocations: !!lavorazione.geolocations,
      geolocationsCount: lavorazione.geolocations?.length || 0
    })
    
    // Header
    this.addHeader()
    
    // Titolo principale
    this.addTitle(`REPORT LAVORAZIONE`)
    this.currentY += 5
    
    // ID e titolo
    this.addKeyValue('ID Lavorazione', lavorazione.id.substring(0, 8) + '...')
    this.addKeyValue('Titolo', lavorazione.titolo || lavorazione.descrizione)
    this.addSeparator()
    
    // Informazioni generali
    this.addSubtitle('INFORMAZIONI GENERALI')
    this.addKeyValue('Descrizione', lavorazione.descrizione)
    this.addKeyValue('Stato', this.getStatoLabel(lavorazione.stato))
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
      this.addSubtitle('NOTE')
      this.addText(lavorazione.note)
      this.addSeparator()
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
      this.addText('Firma digitale del sopralluoghista:')
      this.currentY += 5
      
      try {
        const firmaSuccess = await this.addImage(lavorazione.firma, 100, 40)
        if (firmaSuccess) {
          console.log('✅ Firma aggiunta al PDF con successo')
        } else {
          console.error('❌ Firma non aggiunta (addImage returned false)')
          this.addText('[Errore: Firma non caricabile]')
        }
      } catch (error) {
        console.error('❌ Errore aggiunta firma al PDF:', error)
        this.addText(`[Errore caricamento firma: ${error}]`)
      }
    } else {
      this.addText('Firma non disponibile per questa lavorazione')
      if (lavorazione.stato !== 'completata') {
        this.addText('(La lavorazione non è stata completata)')
      }
    }
    this.addSeparator()
    
    // Firma digitale (legacy - per compatibilità)
    this.addSubtitle('VALIDAZIONE')
    this.addText('Questo documento è stato generato automaticamente dal sistema di gestione verifiche condominiali.')
    this.addText(`Data generazione: ${new Date().toLocaleString('it-IT')}`)
    if (lavorazione.stato === 'completata') {
      this.addText('✓ Verifica completata e validata dal sopralluoghista assegnato')
    }
    
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