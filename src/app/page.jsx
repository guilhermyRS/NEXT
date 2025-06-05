"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, User, CheckCircle, Send } from "lucide-react"

const CHAT_STEPS = {
  GREETING: "greeting",
  NAME: "name",
  CPF: "cpf",
  SERVICE: "service",
  BARBER: "barber",
  TIME: "time",
  SUMMARY: "summary",
  SUCCESS: "success",
}

const SERVICES = [
  { id: "corte", name: "Corte de Cabelo", price: "R$ 25,00", icon: "✂️" },
  { id: "barba", name: "Barba", price: "R$ 20,00", icon: "🧔" },
  { id: "combo", name: "Corte + Barba", price: "R$ 40,00", icon: "💫" },
  { id: "sobrancelha", name: "Sobrancelha", price: "R$ 15,00", icon: "👁️" },
]

const BARBERS = [
  { id: "joao", name: "João Silva" },
  { id: "pedro", name: "Pedro Santos" },
  { id: "carlos", name: "Carlos Oliveira" },
  { id: "qualquer", name: "Qualquer barbeiro disponível" },
]

const TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

export default function Home() {
  const [messages, setMessages] = useState([])
  const [currentStep, setCurrentStep] = useState(CHAT_STEPS.GREETING)
  const [userInput, setUserInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    cpf: "",
    service: null,
    barber: null,
    time: "",
  })

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, showOptions])

  useEffect(() => {
    startChat()
  }, [])

  const startChat = () => {
    setMessages([])
    setCurrentStep(CHAT_STEPS.GREETING)
    setShowOptions(false)
    setUserData({
      name: "",
      cpf: "",
      service: null,
      barber: null,
      time: "",
    })

    setTimeout(() => {
      addBotMessage("Olá! Bem-vindo à nossa barbearia! 💈")
      setTimeout(() => {
        addBotMessage("Vou te ajudar a agendar seu horário. Para começar, qual é o seu nome?")
        setCurrentStep(CHAT_STEPS.NAME)
      }, 1000)
    }, 500)
  }

  const addBotMessage = (text) => {
    setIsTyping(true)
    setShowOptions(false)

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text,
          timestamp: new Date(),
          id: Date.now() + Math.random(),
        },
      ])
      setIsTyping(false)
    }, 1000)
  }

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text,
        timestamp: new Date(),
        id: Date.now() + Math.random(),
      },
    ])
  }

  const handleSendMessage = () => {
    if (!userInput.trim()) return

    addUserMessage(userInput)
    processUserInput(userInput)
    setUserInput("")
  }

  const processUserInput = (input) => {
    switch (currentStep) {
      case CHAT_STEPS.NAME:
        setUserData((prev) => ({ ...prev, name: input }))
        setTimeout(() => {
          addBotMessage(`Prazer em conhecê-lo, ${input}! 😊`)
          setTimeout(() => {
            addBotMessage("Agora preciso do seu CPF para o cadastro (apenas números):")
            setCurrentStep(CHAT_STEPS.CPF)
          }, 1000)
        }, 500)
        break

      case CHAT_STEPS.CPF:
        const cleanCpf = input.replace(/\D/g, "")
        if (cleanCpf.length === 11) {
          const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
          setUserData((prev) => ({ ...prev, cpf: formattedCpf }))
          setTimeout(() => {
            addBotMessage("Perfeito! Dados salvos com sucesso. ✅")
            setTimeout(() => {
              addBotMessage("Agora me diga, qual serviço você gostaria?")
              setTimeout(() => {
                setCurrentStep(CHAT_STEPS.SERVICE)
                setShowOptions(true)
              }, 500)
            }, 1000)
          }, 500)
        } else {
          setTimeout(() => {
            addBotMessage("Por favor, digite um CPF válido com 11 dígitos:")
          }, 500)
        }
        break

      default:
        break
    }
  }

  const handleServiceSelect = (service) => {
    setUserData((prev) => ({ ...prev, service }))
    setShowOptions(false)
    addUserMessage(`${service.icon} ${service.name}`)

    setTimeout(() => {
      addBotMessage(`Excelente escolha! ${service.name} por ${service.price} 💰`)
      setTimeout(() => {
        addBotMessage("Agora, você tem algum barbeiro de preferência?")
        setTimeout(() => {
          setCurrentStep(CHAT_STEPS.BARBER)
          setShowOptions(true)
        }, 500)
      }, 1000)
    }, 500)
  }

  const handleBarberSelect = (barber) => {
    setUserData((prev) => ({ ...prev, barber }))
    setShowOptions(false)
    addUserMessage(`👨‍💼 ${barber.name}`)

    setTimeout(() => {
      addBotMessage(`Ótimo! ${barber.name} é uma excelente escolha!`)
      setTimeout(() => {
        addBotMessage("Para finalizar, qual horário você prefere?")
        setTimeout(() => {
          setCurrentStep(CHAT_STEPS.TIME)
          setShowOptions(true)
        }, 500)
      }, 1000)
    }, 500)
  }

  const handleTimeSelect = (time) => {
    setUserData((prev) => ({ ...prev, time }))
    setShowOptions(false)
    addUserMessage(`🕐 ${time}h`)

    setTimeout(() => {
      addBotMessage("Perfeito! Deixe-me confirmar todos os dados:")
      setTimeout(() => {
        setCurrentStep(CHAT_STEPS.SUMMARY)
        setShowOptions(true)
      }, 800)
    }, 500)
  }

  const handleConfirmBooking = () => {
    setShowOptions(false)
    addUserMessage("✅ Confirmar agendamento")

    setTimeout(() => {
      addBotMessage("🎉 Agendamento realizado com sucesso!")
      setTimeout(() => {
        addBotMessage(
          `Obrigado por escolher nossa barbearia, ${userData.name}! Te esperamos no horário marcado. Até logo! 👋`,
        )
        setTimeout(() => {
          setCurrentStep(CHAT_STEPS.SUCCESS)
          setShowOptions(true)
        }, 500)
      }, 1000)
    }, 500)
  }

  const TypingIndicator = () => (
    <div className="flex items-center space-x-2 p-3 bg-zinc-800 rounded-lg max-w-20">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-zinc-400 rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-zinc-400 rounded-full typing-dot delay-1"></div>
        <div className="w-2 h-2 bg-zinc-400 rounded-full typing-dot delay-2"></div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 p-0 sm:p-4">
      <div className="max-w-md mx-auto h-screen sm:h-[90vh] sm:max-h-[800px]">
        <Card className="h-full bg-zinc-900 border-zinc-800 shadow-lg rounded-none sm:rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-zinc-800 bg-zinc-900">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarFallback className="bg-zinc-800 text-zinc-100">💈</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-zinc-100">Barbearia Premium</h2>
              <p className="text-sm text-zinc-400">Agente Virtual</p>
            </div>
            <Badge className="ml-auto bg-green-900 text-green-300">Online</Badge>
          </div>

          <CardContent className="flex flex-col h-full p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-container">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} message-item`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-lg ${
                      message.type === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-base leading-relaxed">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}

              {showOptions && (
                <div className="options-container">
                  {currentStep === CHAT_STEPS.SERVICE && (
                    <div className="space-y-2 mt-2">
                      {SERVICES.map((service) => (
                        <Button
                          key={service.id}
                          variant="outline"
                          className="w-full justify-between h-auto p-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                          onClick={() => handleServiceSelect(service)}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{service.icon}</span>
                            <span>{service.name}</span>
                          </div>
                          <Badge variant="secondary" className="bg-zinc-700 text-zinc-200">
                            {service.price}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}

                  {currentStep === CHAT_STEPS.BARBER && (
                    <div className="space-y-2 mt-2">
                      {BARBERS.map((barber) => (
                        <Button
                          key={barber.id}
                          variant="outline"
                          className="w-full justify-start h-auto p-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                          onClick={() => handleBarberSelect(barber)}
                        >
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-zinc-400" />
                            <span>{barber.name}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}

                  {currentStep === CHAT_STEPS.TIME && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                      {TIME_SLOTS.map((time) => (
                        <Button
                          key={time}
                          variant="outline"
                          className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                          onClick={() => handleTimeSelect(time)}
                        >
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-sm">{time}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}

                  {currentStep === CHAT_STEPS.SUMMARY && (
                    <Card className="mt-2 bg-zinc-800 border-zinc-700">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-3 text-zinc-100">Resumo do Agendamento</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Nome:</span>
                            <span className="text-zinc-100">{userData.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">CPF:</span>
                            <span className="text-zinc-100">{userData.cpf}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Serviço:</span>
                            <span className="text-zinc-100">{userData.service?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Preço:</span>
                            <span className="text-green-400">{userData.service?.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Barbeiro:</span>
                            <span className="text-zinc-100">{userData.barber?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Horário:</span>
                            <span className="text-zinc-100">{userData.time}h</span>
                          </div>
                        </div>
                        <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={handleConfirmBooking}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Agendamento
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {currentStep === CHAT_STEPS.SUCCESS && (
                    <Button onClick={startChat} className="w-full mt-2 bg-zinc-700 hover:bg-zinc-600">
                      Novo Agendamento
                    </Button>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {(currentStep === CHAT_STEPS.NAME || currentStep === CHAT_STEPS.CPF) && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={currentStep === CHAT_STEPS.CPF ? "Digite seu CPF..." : "Digite sua resposta..."}
                    className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-400 text-base"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isTyping}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
