"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Calculator } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Product {
  name: string
  originalPrice: number
  discount: string
  finalPrice: number
  savingsAmount: number
  savingsPercentage: number
}

export default function DiscountCalculator() {
  const [productName, setProductName] = useState("")
  const [originalPrice, setOriginalPrice] = useState("")
  const [discount, setDiscount] = useState("")
  const [singleProduct, setSingleProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [csvError, setCsvError] = useState("")

  const calculateDiscount = (
    price: number,
    discountValue: string,
  ): { finalPrice: number; savingsAmount: number; savingsPercentage: number } => {
    let finalPrice = price
    let savingsAmount = 0

    if (discountValue.includes("%")) {
      const percentage = Number.parseFloat(discountValue)
      savingsAmount = (price * percentage) / 100
      finalPrice = price - savingsAmount
    } else {
      savingsAmount = Number.parseFloat(discountValue)
      finalPrice = price - savingsAmount
    }

    const savingsPercentage = (savingsAmount / price) * 100

    return {
      finalPrice,
      savingsAmount,
      savingsPercentage,
    }
  }

  const handleSingleCalculation = (e: React.FormEvent) => {
    e.preventDefault()

    if (!originalPrice || !discount) return

    const price = Number.parseFloat(originalPrice)
    const { finalPrice, savingsAmount, savingsPercentage } = calculateDiscount(price, discount)

    setSingleProduct({
      name: productName || "Prodotto",
      originalPrice: price,
      discount,
      finalPrice,
      savingsAmount,
      savingsPercentage,
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string
        const lines = csvData.split("\n")

        // Skip header row and process data
        const processedProducts: Product[] = []

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const [name, priceStr, discountStr] = line.split(",")

          if (!name || !priceStr || !discountStr) {
            setCsvError("Formato CSV non valido. Usa: nome_prodotto,prezzo_originale,sconto")
            return
          }

          const price = Number.parseFloat(priceStr)

          if (isNaN(price)) {
            setCsvError(`Prezzo non valido per ${name}: ${priceStr}`)
            return
          }

          const { finalPrice, savingsAmount, savingsPercentage } = calculateDiscount(price, discountStr)

          processedProducts.push({
            name,
            originalPrice: price,
            discount: discountStr,
            finalPrice,
            savingsAmount,
            savingsPercentage,
          })
        }

        setProducts(processedProducts)
        setCsvError("")
      } catch (error) {
        setCsvError("Errore durante l'elaborazione del file CSV")
      }
    }

    reader.readAsText(file)
  }

  const calculateTotals = (productList: Product[]) => {
    const totalOriginal = productList.reduce((sum, product) => sum + product.originalPrice, 0)
    const totalFinal = productList.reduce((sum, product) => sum + product.finalPrice, 0)
    const totalSavings = totalOriginal - totalFinal
    const totalSavingsPercentage = (totalSavings / totalOriginal) * 100

    return {
      totalOriginal,
      totalFinal,
      totalSavings,
      totalSavingsPercentage,
    }
  }

  const formatCurrency = (value: number) => {
    return `€${value.toFixed(2)}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Calcolatore di Sconti</h1>

      <Tabs defaultValue="single" className="max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="single">
            <Calculator className="mr-2 h-4 w-4" />
            Calcolo Singolo
          </TabsTrigger>
          <TabsTrigger value="multiple">
            <Upload className="mr-2 h-4 w-4" />
            Carica CSV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Calcola Prezzo Scontato</CardTitle>
              <CardDescription>
                Inserisci i dettagli del prodotto per calcolare il prezzo finale dopo lo sconto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSingleCalculation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Nome Prodotto (opzionale)</Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Nome del prodotto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Prezzo Originale (€)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="100.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Sconto (% o valore fisso)</Label>
                  <Input
                    id="discount"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="20% o 20"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Inserisci una percentuale (es. "20%") o un valore fisso (es. "20")
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  Calcola
                </Button>
              </form>

              {singleProduct && (
                <div className="mt-8 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{singleProduct.name}</h3>
                  <div className="space-y-2">
                    <p>Prezzo originale: {formatCurrency(singleProduct.originalPrice)}</p>
                    <p>
                      Sconto:{" "}
                      {singleProduct.discount.includes("%")
                        ? singleProduct.discount
                        : formatCurrency(Number.parseFloat(singleProduct.discount))}{" "}
                      ({formatCurrency(singleProduct.savingsAmount)})
                    </p>
                    <Separator />
                    <p className="font-bold">Prezzo finale: {formatCurrency(singleProduct.finalPrice)}</p>
                    <p>
                      Risparmio: {formatCurrency(singleProduct.savingsAmount)} (
                      {formatPercentage(singleProduct.savingsPercentage)})
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiple">
          <Card>
            <CardHeader>
              <CardTitle>Calcolo Multiplo da CSV</CardTitle>
              <CardDescription>
                Carica un file CSV con i dettagli dei prodotti per calcolare più prezzi scontati contemporaneamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csvFile">File CSV</Label>
                  <Input id="csvFile" type="file" accept=".csv" onChange={handleFileUpload} />
                  <p className="text-sm text-muted-foreground">Formato CSV: nome_prodotto,prezzo_originale,sconto</p>
                </div>

                {csvError && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{csvError}</div>}

                {products.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-lg mb-4">Risultati</h3>

                    <div className="space-y-4">
                      {products.map((product, index) => (
                        <div key={index} className="p-3 border rounded-md">
                          <h4 className="font-medium">{product.name}</h4>
                          <p>
                            da {formatCurrency(product.originalPrice)} a {formatCurrency(product.finalPrice)}
                            (sconto:{" "}
                            {product.discount.includes("%")
                              ? product.discount
                              : formatCurrency(Number.parseFloat(product.discount))}
                            )
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Risparmio: {formatCurrency(product.savingsAmount)} (
                            {formatPercentage(product.savingsPercentage)})
                          </p>
                        </div>
                      ))}
                    </div>

                    {products.length > 1 && (
                      <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">Riepilogo</h3>
                        {(() => {
                          const totals = calculateTotals(products)
                          return (
                            <div className="space-y-1">
                              <p>Totale originale: {formatCurrency(totals.totalOriginal)}</p>
                              <p>Totale scontato: {formatCurrency(totals.totalFinal)}</p>
                              <p className="font-bold">
                                Risparmio totale: {formatCurrency(totals.totalSavings)} (
                                {formatPercentage(totals.totalSavingsPercentage)})
                              </p>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

